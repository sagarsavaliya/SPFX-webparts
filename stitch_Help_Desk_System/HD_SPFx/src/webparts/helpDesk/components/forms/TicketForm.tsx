import * as React from 'react';
import { useState, useEffect } from 'react';
import { TicketService, SPService } from '../../services';
import { ICategory, ISubCategory } from '../../models';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../shared/Card';
import commonStyles from '../../styles/common.module.scss';
import styles from './TicketForm.module.scss';

interface ITicketFormProps {
  onNavigate: (route: string) => void;
}

interface IFormData {
  Title: string;
  Description: string;
  CategoryId: number | undefined;
  SubCategoryId: number | undefined;
  Priority: string;
  Impact: string;
  Urgency: string;
  CCUsers: string[];
}

interface IUserSuggestion {
  email: string;
  displayName: string;
}

/**
 * TicketForm Component
 * Form for creating a new help desk ticket
 */
export const TicketForm: React.FC<ITicketFormProps> = ({ onNavigate }) => {
  // const { } = useAppContext(); // Not needed for now
  const [formData, setFormData] = useState<IFormData>({
    Title: '',
    Description: '',
    CategoryId: undefined,
    SubCategoryId: undefined,
    Priority: 'Medium',
    Impact: 'Individual',
    Urgency: 'Medium',
    CCUsers: []
  });

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [subCategories, setSubCategories] = useState<ISubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<ISubCategory[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState(false);

  // People Picker state
  const [ccUserInput, setCCUserInput] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<IUserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load categories and subcategories
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [cats, subCats] = await Promise.all([
          TicketService.getCategories(),
          TicketService.getSubCategories()
        ]);
        setCategories(cats);
        setSubCategories(subCats);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load form data. Please try again.');
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (formData.CategoryId) {
      const filtered = subCategories.filter(
        (sc) => sc.CategoryId === formData.CategoryId
      );
      setFilteredSubCategories(filtered);
      // Reset subcategory if it's not in the filtered list
      if (formData.SubCategoryId && !filtered.find(sc => sc.Id === formData.SubCategoryId)) {
        setFormData((prev) => ({ ...prev, SubCategoryId: undefined }));
      }
    } else {
      setFilteredSubCategories([]);
      setFormData((prev) => ({ ...prev, SubCategoryId: undefined }));
    }
  }, [formData.CategoryId, subCategories, formData.SubCategoryId]);

  const handleInputChange = (
    field: keyof IFormData,
    value: string | number | undefined
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Append to existing attachments instead of replacing
      setAttachments(prev => [...prev, ...filesArray]);
      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number): void => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // People Picker handlers
  const handleCCUserInputChange = async (value: string): Promise<void> => {
    setCCUserInput(value);

    if (value.length >= 3) {
      try {
        const sp = SPService.getSP();
        // Search for users in site
        const users = await sp.web.siteUsers.filter(`substringof('${value}', Title) or substringof('${value}', Email)`).top(10)();

        const suggestions: IUserSuggestion[] = users.map(u => ({
          email: u.Email,
          displayName: u.Title
        }));

        setUserSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error searching users:', err);
      }
    } else {
      setUserSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addCCUser = (user: IUserSuggestion): void => {
    if (!formData.CCUsers.includes(user.email)) {
      setFormData(prev => ({
        ...prev,
        CCUsers: [...prev.CCUsers, user.email]
      }));
    }
    setCCUserInput('');
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  const removeCCUser = (email: string): void => {
    setFormData(prev => ({
      ...prev,
      CCUsers: prev.CCUsers.filter(e => e !== email)
    }));
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      default: return '📎';
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validation
    if (!formData.Title || formData.Title.trim() === '') {
      setError('Please enter a ticket subject');
      return;
    }

    if (!formData.Description || formData.Description.trim() === '') {
      setError('Please enter a ticket description');
      return;
    }

    if (!formData.CategoryId) {
      setError('Please select a category');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(undefined);

      // Create the ticket
      await TicketService.createTicket({
        Title: formData.Title.trim(),
        Description: formData.Description.trim(),
        CategoryId: formData.CategoryId,
        SubCategoryId: formData.SubCategoryId,
        Impact: formData.Impact as any,
        Urgency: formData.Urgency as any,
        CCUsers: formData.CCUsers,
        Attachments: []
      }, attachments);

      setSuccess(true);
      setIsSubmitting(false);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        onNavigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading form..." />;
  }

  if (success) {
    return (
      <div className={styles.successContainer}>
        <Card>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.successTitle}>
              Ticket Created Successfully!
            </h2>
            <p className={styles.successMessage}>
              Your ticket has been submitted. You will be redirected to the ticket details...
            </p>
            <LoadingSpinner size="small" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          Create New Ticket
        </h1>
        <p className={styles.headerSubtitle}>
          Fill out the form below to submit a new help desk ticket
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          {error && (
            <div className={styles.errorSection}>
              <ErrorMessage message={error} />
            </div>
          )}

          <div className={styles.formContainer}>
            {/* Subject */}
            <div className={styles.formField}>
              <label htmlFor="subject" className={styles.formLabel}>
                Subject <span className={styles.requiredStar}>*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={formData.Title}
                onChange={(e) => handleInputChange('Title', e.target.value)}
                placeholder="Brief description of your issue"
                className={styles.formInput}
                required
              />
            </div>

            {/* Description */}
            <div className={styles.formField}>
              <label htmlFor="description" className={styles.formLabel}>
                Description <span className={styles.requiredStar}>*</span>
              </label>
              <textarea
                id="description"
                value={formData.Description}
                onChange={(e) => handleInputChange('Description', e.target.value)}
                placeholder="Provide detailed information about your issue..."
                rows={6}
                className={styles.formTextarea}
                required
              />
            </div>

            {/* Category and SubCategory Row */}
            <div className={commonStyles.grid2}>
              {/* Category */}
              <div className={styles.formField}>
                <label htmlFor="category" className={styles.formLabel}>
                  Category <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  id="category"
                  value={formData.CategoryId || ''}
                  onChange={(e) =>
                    handleInputChange('CategoryId', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className={styles.formSelect}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.Id} value={cat.Id}>
                      {cat.Title}
                    </option>
                  ))}
                </select>
              </div>

              {/* SubCategory */}
              <div className={styles.formField}>
                <label htmlFor="subcategory" className={styles.formLabel}>
                  Sub-Category
                </label>
                <select
                  id="subcategory"
                  value={formData.SubCategoryId || ''}
                  onChange={(e) =>
                    handleInputChange('SubCategoryId', e.target.value ? Number(e.target.value) : undefined)
                  }
                  disabled={filteredSubCategories.length === 0}
                  className={styles.formSelect}
                >
                  <option value="">Select a sub-category (optional)</option>
                  {filteredSubCategories.map((subCat) => (
                    <option key={subCat.Id} value={subCat.Id}>
                      {subCat.Title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority, Impact, Urgency Row */}
            <div className={commonStyles.grid3}>
              {/* Priority */}
              <div className={styles.formField}>
                <label htmlFor="priority" className={styles.formLabel}>
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.Priority}
                  onChange={(e) => handleInputChange('Priority', e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Impact */}
              <div className={styles.formField}>
                <label htmlFor="impact" className={styles.formLabel}>
                  Impact
                </label>
                <select
                  id="impact"
                  value={formData.Impact}
                  onChange={(e) => handleInputChange('Impact', e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Individual">Individual</option>
                  <option value="Department">Department</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>

              {/* Urgency */}
              <div className={styles.formField}>
                <label htmlFor="urgency" className={styles.formLabel}>
                  Urgency
                </label>
                <select
                  id="urgency"
                  value={formData.Urgency}
                  onChange={(e) => handleInputChange('Urgency', e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* CC Users - People Picker */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                CC Users (Optional)
              </label>

              {/* Selected Users */}
              {formData.CCUsers.length > 0 && (
                <div className={styles.selectedUsersContainer}>
                  {formData.CCUsers.map((email) => (
                    <div key={email} className={styles.selectedUserPill}>
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeCCUser(email)}
                        className={styles.removeUserButton}
                        title="Remove user"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User Input with Suggestions */}
              <div className={styles.suggestionsContainer}>
                <input
                  type="text"
                  value={ccUserInput}
                  onChange={(e) => void handleCCUserInputChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type to search users..."
                  className={styles.formInput}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && userSuggestions.length > 0 && (
                  <div className={styles.suggestionsDropdown}>
                    {userSuggestions.map((user) => (
                      <div
                        key={user.email}
                        onClick={() => addCCUser(user)}
                        className={styles.suggestionItem}
                      >
                        <div className={styles.suggestionName}>
                          {user.displayName}
                        </div>
                        <div className={styles.suggestionEmail}>
                          {user.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className={styles.helpText}>
                Type at least 3 characters to search for users
              </p>
            </div>

            {/* Attachments */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                Attachments (Optional)
              </label>

              {/* Hidden file input */}
              <input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Custom attach button */}
              <label htmlFor="attachments" className={styles.attachButton}>
                <span>📎</span>
                <span>Add Files</span>
              </label>

              {/* File list */}
              {attachments.length > 0 && (
                <div className={styles.attachmentsList}>
                  {attachments.map((file, index) => (
                    <div key={index} className={styles.attachmentItem}>
                      <div className={styles.attachmentInfo}>
                        {/* File icon */}
                        <span className={styles.attachmentIcon}>{getFileIcon(file.name)}</span>

                        {/* File info */}
                        <div className={styles.attachmentDetails}>
                          <div className={styles.attachmentName}>
                            {file.name}
                          </div>
                          <div className={styles.attachmentSize}>
                            {file.size < 1024
                              ? `${file.size} B`
                              : file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className={styles.removeAttachmentButton}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className={styles.helpText}>
                {attachments.length > 0
                  ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} attached`
                  : 'Click "Add Files" to attach documents, images, or other files'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className={styles.formActions}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Ticket...' : 'Submit Ticket'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => onNavigate('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
