import * as React from 'react';
import { useState, useEffect } from 'react';
import { FAQService } from '../../services';
import { IFAQByCategory } from '../../models';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';

interface IFAQsPageProps {
  onNavigate: (route: string) => void;
}

/**
 * FAQs Page Component
 * Modern, professional FAQ interface with clean accordion design
 */
export const FAQsPage: React.FC<IFAQsPageProps> = () => {
  const [faqsByCategory, setFaqsByCategory] = useState<IFAQByCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Load FAQs
  useEffect(() => {
    const loadFAQs = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const data = await FAQService.getFAQsByCategory();
        setFaqsByCategory(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading FAQs:', err);
        setError('Failed to load FAQs. Please try again.');
        setIsLoading(false);
      }
    };

    void loadFAQs();
  }, []);

  const toggleFAQ = (faqId: number): void => {
    const expandedArray: number[] = [];
    expandedFAQs.forEach(id => expandedArray.push(id));
    const newExpanded = new Set<number>(expandedArray);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFAQs(newExpanded);
  };

  const handleMarkHelpful = async (faqId: number): Promise<void> => {
    try {
      await FAQService.markHelpful(faqId);
      // Update local state
      setFaqsByCategory(prev => prev.map(category => ({
        ...category,
        faqs: category.faqs.map(faq =>
          faq.Id === faqId ? { ...faq, Helpful: (faq.Helpful || 0) + 1 } : faq
        )
      })));
    } catch (err) {
      console.error('Error marking FAQ as helpful:', err);
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Filter FAQs based on search and category
  const filteredFAQsByCategory = faqsByCategory
    .map(category => ({
      ...category,
      faqs: category.faqs.filter(faq => {
        const matchesSearch = !searchText ||
          faq.Question.toLowerCase().includes(searchText.toLowerCase()) ||
          stripHtml(faq.Answer).toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = !selectedCategory || category.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    }))
    .filter(category => category.faqs.length > 0);

  if (isLoading) {
    return <LoadingSpinner message="Loading FAQs..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const totalFAQs = faqsByCategory.reduce((sum, cat) => sum + cat.faqs.length, 0);
  const filteredCount = filteredFAQsByCategory.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px 32px',
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '12px',
          margin: 0
        }}>
          ❓ Frequently Asked Questions
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.9)',
          margin: '8px 0 0 0'
        }}>
          Quick answers to common questions about our help desk system
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedCategory ? '1fr auto' : '1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search FAQs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
            />
          </div>

          {/* Clear Filters */}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '12px 20px',
                background: '#334155',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#475569'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#334155'; }}
            >
              ✕ Clear Filter
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {faqsByCategory.map(category => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategory(
                selectedCategory === category.categoryId ? null : category.categoryId
              )}
              style={{
                padding: '8px 16px',
                background: selectedCategory === category.categoryId ? '#3b82f6' : '#1e293b',
                border: `1px solid ${selectedCategory === category.categoryId ? '#3b82f6' : '#334155'}`,
                borderRadius: '20px',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.categoryId) {
                  e.currentTarget.style.borderColor = '#475569';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.categoryId) {
                  e.currentTarget.style.borderColor = '#334155';
                }
              }}
            >
              <span>{category.categoryTitle}</span>
              <span style={{
                background: selectedCategory === category.categoryId ? 'rgba(255,255,255,0.2)' : '#334155',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {category.faqs.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {(searchText || selectedCategory) && (
        <div style={{
          padding: '12px 16px',
          background: '#1e293b',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
            📋 Showing <strong style={{ color: 'white' }}>{filteredCount}</strong> of {totalFAQs} FAQs
            {selectedCategory && ` in ${faqsByCategory.find(c => c.categoryId === selectedCategory)?.categoryTitle}`}
          </span>
        </div>
      )}

      {/* FAQs List */}
      {filteredFAQsByCategory.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              No FAQs Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              {searchText
                ? 'Try adjusting your search terms or filters'
                : 'No FAQs are available at this time'}
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredFAQsByCategory.map(category => (
            <div key={category.categoryId}>
              {/* Category Badge (only show if no category filter is active) */}
              {!selectedCategory && (
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  marginTop: '16px'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>
                    {category.categoryTitle}
                  </span>
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    color: '#64748b',
                    background: '#0f172a',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {category.faqs.length}
                  </span>
                </div>
              )}

              {/* FAQ Items */}
              {category.faqs.map((faq) => {
                const isExpanded = expandedFAQs.has(faq.Id);

                return (
                  <div
                    key={faq.Id}
                    style={{
                      background: '#1e293b',
                      border: `1px solid ${isExpanded ? '#3b82f6' : '#334155'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Question Header */}
                    <div
                      onClick={() => toggleFAQ(faq.Id)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        background: isExpanded ? '#0f172a' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                        <span style={{
                          fontSize: '18px',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {isExpanded ? '📖' : '❔'}
                        </span>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'white',
                          lineHeight: '1.5'
                        }}>
                          {faq.Question}
                        </span>
                      </div>

                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isExpanded ? '#3b82f6' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          color: 'white',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          display: 'inline-block'
                        }}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Answer - Expandable */}
                    {isExpanded && (
                      <div style={{
                        padding: '0 20px 20px 52px',
                        background: '#0f172a',
                        borderTop: '1px solid #1e293b'
                      }}>
                        {/* Answer Content */}
                        <div
                          style={{
                            color: '#cbd5e1',
                            lineHeight: '1.7',
                            fontSize: '14px',
                            marginBottom: '16px'
                          }}
                          dangerouslySetInnerHTML={{ __html: faq.Answer }}
                        />

                        {/* Footer Actions */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid #1e293b'
                        }}>
                          {/* Stats */}
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '12px',
                            color: '#64748b'
                          }}>
                            {faq.Views !== undefined && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>👁️</span>
                                <span>{faq.Views} views</span>
                              </span>
                            )}
                            {faq.Helpful !== undefined && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>👍</span>
                                <span>{faq.Helpful} helpful</span>
                              </span>
                            )}
                          </div>

                          {/* Helpful Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleMarkHelpful(faq.Id);
                            }}
                            style={{
                              padding: '6px 16px',
                              background: '#334155',
                              border: '1px solid #475569',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#10b981';
                              e.currentTarget.style.borderColor = '#10b981';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#334155';
                              e.currentTarget.style.borderColor = '#475569';
                            }}
                          >
                            <span>👍</span>
                            <span>Helpful</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      {totalFAQs > 0 && !searchText && !selectedCategory && (
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            📚 Total: <strong style={{ color: 'white' }}>{totalFAQs}</strong> FAQs across{' '}
            <strong style={{ color: 'white' }}>{faqsByCategory.length}</strong> categories
          </span>
        </div>
      )}
    </div>
  );
};
