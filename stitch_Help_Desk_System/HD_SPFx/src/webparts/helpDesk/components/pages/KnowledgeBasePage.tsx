import * as React from 'react';
import { useState, useEffect } from 'react';
import { KBService } from '../../services';
import { IKBArticle, ICategory } from '../../models';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import styles from '../../styles/common.module.scss';

interface IKnowledgeBasePageProps {
  onNavigate: (route: string) => void;
}

/**
 * Knowledge Base Page Component
 * Displays published KB articles with search and filtering
 */
export const KnowledgeBasePage: React.FC<IKnowledgeBasePageProps> = ({ onNavigate }) => {
  const [articles, setArticles] = useState<IKBArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<IKBArticle[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'helpful'>('recent');

  // Load articles
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const articlesData = await KBService.getArticles({ isPublished: true, sortBy });

        setArticles(articlesData);
        setFilteredArticles(articlesData);

        // Extract unique categories from articles
        const uniqueCategories: Map<number, ICategory> = new Map();
        articlesData.forEach(article => {
          if (article.CategoryId && article.CategoryTitle) {
            uniqueCategories.set(article.CategoryId, {
              Id: article.CategoryId,
              Title: article.CategoryTitle,
              IsActive: true,
              SLAHours: 24
            });
          }
        });

        const categoriesArray: ICategory[] = [];
        uniqueCategories.forEach(value => categoriesArray.push(value));
        setCategories(categoriesArray);

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading KB articles:', err);
        setError('Failed to load knowledge base articles. Please try again.');
        setIsLoading(false);
      }
    };

    void loadData();
  }, [sortBy]);

  // Filter articles
  useEffect(() => {
    let filtered = [...articles];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(a => a.CategoryId === selectedCategory);
    }

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(a =>
        a.Title.toLowerCase().includes(search) ||
        a.Content.toLowerCase().includes(search) ||
        a.Keywords?.some(k => k.toLowerCase().includes(search))
      );
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchText]);

  const handleMarkHelpful = async (articleId: number): Promise<void> => {
    try {
      await KBService.markHelpful(articleId);
      // Update local state
      setArticles(prev => prev.map(a =>
        a.Id === articleId ? { ...a, Helpful: a.Helpful + 1 } : a
      ));
    } catch (err) {
      console.error('Error marking article as helpful:', err);
    }
  };

  const handleMarkNotHelpful = async (articleId: number): Promise<void> => {
    try {
      await KBService.markNotHelpful(articleId);
      // Update local state
      setArticles(prev => prev.map(a =>
        a.Id === articleId ? { ...a, NotHelpful: a.NotHelpful + 1 } : a
      ));
    } catch (err) {
      console.error('Error marking article as not helpful:', err);
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (isLoading) {
    return (
      <div className={styles.helpDeskRoot}>
        <div className={styles.contentWrapper}>
          <LoadingSpinner message="Loading knowledge base articles..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.helpDeskRoot}>
        <div className={styles.contentWrapper}>
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.helpDeskRoot} style={{ "padding": "24px" }}>
      <div className={styles.contentWrapper}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '8px' }}>Knowledge Base</h2>
          <p style={{ color: '#666', marginTop: 0 }}>
            Browse helpful articles and guides
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: '1 1 300px' }}>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={styles.input}
                style={{ width: '100%' }}
              />
            </div>

            {/* Category filter */}
            <div style={{ flex: '1 1 200px' }}>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                className={styles.input}
                style={{ width: '100%' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.Id} value={cat.Id}>{cat.Title}</option>
                ))}
              </select>
            </div>

            {/* Sort by */}
            <div style={{ flex: '1 1 150px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={styles.input}
                style={{ width: '100%' }}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results count */}
        <div style={{ margin: '16px 0', color: '#666' }}>
          Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
        </div>

        {/* Articles list */}
        {filteredArticles.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#666', margin: 0 }}>
                {searchText || selectedCategory
                  ? 'No articles match your search criteria.'
                  : 'No articles available at this time.'}
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredArticles.map(article => (
              <Card key={article.Id}>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>
                    {article.Title}
                  </h3>
                  {article.CategoryTitle && (
                    <span className={styles.badge} style={{ backgroundColor: '#0f172a' }}>
                      {article.CategoryTitle}
                    </span>
                  )}
                </div>

                {/* Preview */}
                <p style={{ margin: '12px 0', lineHeight: '1.5' }}>
                  {stripHtml(article.Content).substring(0, 200)}
                  {stripHtml(article.Content).length > 200 ? '...' : ''}
                </p>

                {/* Keywords */}
                {article.Keywords && article.Keywords.length > 0 && (
                  <div style={{ margin: '12px 0' }}>
                    {article.Keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          background: '#f0f0f0',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#192436',
                          marginRight: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta info and actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <span style={{ marginRight: '16px' }}>Views: {article.Views}</span>
                    <span style={{ marginRight: '16px' }}>Helpful: {article.Helpful}</span>
                    <span>
                      {new Date(article.PublishedDate || article.Created).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => void handleMarkHelpful(article.Id)}
                      className={styles.button}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      title="Mark as helpful"
                    >
                      Helpful
                    </button>
                    <button
                      onClick={() => void handleMarkNotHelpful(article.Id)}
                      className={styles.button}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      title="Mark as not helpful"
                    >
                      Not Helpful
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
