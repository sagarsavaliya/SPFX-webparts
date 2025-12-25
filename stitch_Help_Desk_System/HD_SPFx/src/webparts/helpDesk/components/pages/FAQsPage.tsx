import * as React from 'react';
import { useState, useEffect } from 'react';
import { FAQService } from '../../services';
import { IFAQByCategory } from '../../models';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import styles from './FAQsPage.module.scss';

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
      <div className={styles.errorContainer}>
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const totalFAQs = faqsByCategory.reduce((sum, cat) => sum + cat.faqs.length, 0);
  const filteredCount = filteredFAQsByCategory.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          ❓ Frequently Asked Questions
        </h1>
        <p className={styles.heroSubtitle}>
          Quick answers to common questions about our help desk system
        </p>
      </div>

      {/* Search and Filters */}
      <div className={styles.filtersSection}>
        <div className={`${styles.searchGrid} ${selectedCategory ? styles.searchGridWithFilter : styles.searchGridNoFilter}`}>
          {/* Search Input */}
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="🔍 Search FAQs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Clear Filters */}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className={styles.clearFilterButton}
            >
              ✕ Clear Filter
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className={styles.categoryFilters}>
          {faqsByCategory.map(category => {
            const isActive = selectedCategory === category.categoryId;
            return (
              <button
                key={category.categoryId}
                onClick={() => setSelectedCategory(isActive ? null : category.categoryId)}
                className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : styles.categoryPillInactive}`}
              >
                <span>{category.categoryTitle}</span>
                <span className={`${styles.categoryCount} ${isActive ? styles.categoryCountActive : styles.categoryCountInactive}`}>
                  {category.faqs.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      {(searchText || selectedCategory) && (
        <div className={styles.resultsBanner}>
          <span className={styles.resultsText}>
            📋 Showing <strong>{filteredCount}</strong> of {totalFAQs} FAQs
            {selectedCategory && ` in ${faqsByCategory.find(c => c.categoryId === selectedCategory)?.categoryTitle}`}
          </span>
        </div>
      )}

      {/* FAQs List */}
      {filteredFAQsByCategory.length === 0 ? (
        <Card>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🔍</div>
            <h3 className={styles.emptyStateTitle}>
              No FAQs Found
            </h3>
            <p className={styles.emptyStateMessage}>
              {searchText
                ? 'Try adjusting your search terms or filters'
                : 'No FAQs are available at this time'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={styles.faqsList}>
          {filteredFAQsByCategory.map(category => (
            <div key={category.categoryId} className={styles.categorySection}>
              {/* Category Badge (only show if no category filter is active) */}
              {!selectedCategory && (
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryHeaderTitle}>
                    {category.categoryTitle}
                  </span>
                  <span className={styles.categoryHeaderCount}>
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
                    className={`${styles.faqItem} ${isExpanded ? styles.faqItemExpanded : styles.faqItemCollapsed}`}
                  >
                    {/* Question Header */}
                    <div
                      onClick={() => toggleFAQ(faq.Id)}
                      className={`${styles.faqQuestionHeader} ${isExpanded ? styles.faqQuestionHeaderExpanded : ''}`}
                    >
                      <div className={styles.faqQuestionContent}>
                        <span className={styles.faqQuestionIcon}>
                          {isExpanded ? '📖' : '❔'}
                        </span>
                        <span className={styles.faqQuestionText}>
                          {faq.Question}
                        </span>
                      </div>

                      <div className={`${styles.faqExpandButton} ${isExpanded ? styles.faqExpandButtonActive : styles.faqExpandButtonInactive}`}>
                        <span className={`${styles.faqExpandArrow} ${isExpanded ? styles.faqExpandArrowRotated : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Answer - Expandable */}
                    {isExpanded && (
                      <div className={styles.faqAnswerSection}>
                        {/* Answer Content */}
                        <div
                          className={styles.faqAnswerContent}
                          dangerouslySetInnerHTML={{ __html: faq.Answer }}
                        />

                        {/* Footer Actions */}
                        <div className={styles.faqFooterSection}>
                          {/* Stats */}
                          <div className={styles.faqMetaInfo}>
                            {faq.Views !== undefined && (
                              <span className={styles.faqMetaItem}>
                                <span>👁️</span>
                                <span>{faq.Views} views</span>
                              </span>
                            )}
                            {faq.Helpful !== undefined && (
                              <span className={styles.faqMetaItem}>
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
                            className={styles.helpfulButton}
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
        <div className={styles.footerSummary}>
          <span className={styles.footerSummaryText}>
            📚 Total: <strong>{totalFAQs}</strong> FAQs across{' '}
            <strong>{faqsByCategory.length}</strong> categories
          </span>
        </div>
      )}
    </div>
  );
};
