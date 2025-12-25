import * as React from 'react';
import { useState, useEffect } from 'react';
import { KBService } from '../../services';
import { IKBArticle, ICategory } from '../../models';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import commonStyles from '../../styles/common.module.scss';
import styles from './KnowledgeBasePage.module.scss';

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
      <div className={commonStyles.helpDeskRoot}>
        <div className={commonStyles.contentWrapper}>
          <LoadingSpinner message="Loading knowledge base articles..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={commonStyles.helpDeskRoot}>
        <div className={commonStyles.contentWrapper}>
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className={commonStyles.helpDeskRoot}>
      <div className={commonStyles.contentWrapper}>
        <div className={styles.page}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Knowledge Base</h2>
            <p className={styles.headerSubtitle}>
              Browse helpful articles and guides
            </p>
          </div>

          {/* Filters */}
          <Card>
            <div className={styles.filtersContainer}>
              {/* Search */}
              <div className={styles.filterField}>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className={`${commonStyles.input} ${styles.fullWidth}`}
                />
              </div>

              {/* Category filter */}
              <div className={styles.filterFieldMedium}>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                  className={`${commonStyles.input} ${styles.fullWidth}`}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.Id} value={cat.Id}>{cat.Title}</option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div className={styles.filterFieldSmall}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`${commonStyles.input} ${styles.fullWidth}`}
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Results count */}
          <div className={styles.resultsCount}>
            Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </div>

          {/* Articles list */}
          {filteredArticles.length === 0 ? (
            <Card>
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>
                  {searchText || selectedCategory
                    ? 'No articles match your search criteria.'
                    : 'No articles available at this time.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className={styles.articlesGrid}>
              {filteredArticles.map(article => (
                <Card key={article.Id}>
                  <div className={styles.articleHeader}>
                    <h3 className={styles.articleTitle}>
                      {article.Title}
                    </h3>
                    {article.CategoryTitle && (
                      <span className={styles.categoryBadge}>
                        {article.CategoryTitle}
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <p className={styles.articlePreview}>
                    {stripHtml(article.Content).substring(0, 200)}
                    {stripHtml(article.Content).length > 200 ? '...' : ''}
                  </p>

                  {/* Keywords */}
                  {article.Keywords && article.Keywords.length > 0 && (
                    <div className={styles.keywordsContainer}>
                      {article.Keywords.map((keyword, idx) => (
                        <span key={idx} className={styles.keyword}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta info and actions */}
                  <div className={styles.articleFooter}>
                    <div className={styles.articleMeta}>
                      <span className={styles.metaItem}>Views: {article.Views}</span>
                      <span className={styles.metaItem}>Helpful: {article.Helpful}</span>
                      <span>
                        {new Date(article.PublishedDate || article.Created).toLocaleDateString()}
                      </span>
                    </div>

                    <div className={styles.articleActions}>
                      <button
                        onClick={() => void handleMarkHelpful(article.Id)}
                        className={`${commonStyles.button} ${styles.actionButton}`}
                        title="Mark as helpful"
                      >
                        Helpful
                      </button>
                      <button
                        onClick={() => void handleMarkNotHelpful(article.Id)}
                        className={`${commonStyles.button} ${styles.actionButton}`}
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
    </div>
  );
};
