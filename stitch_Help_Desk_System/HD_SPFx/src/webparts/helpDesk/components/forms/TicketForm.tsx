import * as React from 'react';
import { useState, useEffect } from 'react';
import { TicketService, SPService } from '../../services';
import { ICategory, ISubCategory } from '../../models';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { Card } from '../shared/Card';
import styles from '../../styles/common.module.scss';

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
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
              Ticket Created Successfully!
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '24px' }}>
              Your ticket has been submitted. You will be redirected to the ticket details...
            </p>
            <LoadingSpinner size="small" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
          Create New Ticket
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>
          Fill out the form below to submit a new help desk ticket
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          {error && (
            <div style={{ marginBottom: '24px' }}>
              <ErrorMessage message={error} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px'
                }}
              >
                Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={formData.Title}
                onChange={(e) => handleInputChange('Title', e.target.value)}
                placeholder="Brief description of your issue"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px'
                }}
              >
                Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="description"
                value={formData.Description}
                onChange={(e) => handleInputChange('Description', e.target.value)}
                placeholder="Provide detailed information about your issue..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                required
              />
            </div>

            {/* Category and SubCategory Row */}
            <div className={styles.grid2}>
              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '8px'
                  }}
                >
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="category"
                  value={formData.CategoryId || ''}
                  onChange={(e) =>
                    handleInputChange('CategoryId', e.target.value ? Number(e.target.value) : undefined)
                  }
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
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
              <div>
                <label
                  htmlFor="subcategory"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '8px'
                  }}
                >
                  Sub-Category
                </label>
                <select
                  id="subcategory"
                  value={formData.SubCategoryId || ''}
                  onChange={(e) =>
                    handleInputChange('SubCategoryId', e.target.value ? Number(e.target.value) : undefined)
                  }
                  disabled={filteredSubCategories.length === 0}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: filteredSubCategories.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: filteredSubCategories.length === 0 ? 0.5 : 1
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
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
            <div className={styles.grid3}>
              {/* Priority */}
              <div>
                <label
                  htmlFor="priority"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '8px'
                  }}
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.Priority}
                  onChange={(e) => handleInputChange('Priority', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Impact */}
              <div>
                <label
                  htmlFor="impact"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '8px'
                  }}
                >
                  Impact
                </label>
                <select
                  id="impact"
                  value={formData.Impact}
                  onChange={(e) => handleInputChange('Impact', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                >
                  <option value="Individual">Individual</option>
                  <option value="Department">Department</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label
                  htmlFor="urgency"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '8px'
                  }}
                >
                  Urgency
                </label>
                <select
                  id="urgency"
                  value={formData.Urgency}
                  onChange={(e) => handleInputChange('Urgency', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* CC Users - People Picker */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px'
                }}
              >
                CC Users (Optional)
              </label>

              {/* Selected Users */}
              {formData.CCUsers.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {formData.CCUsers.map((email) => (
                    <div
                      key={email}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        background: '#1e40af',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: 'white'
                      }}
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeCCUser(email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: 0,
                          lineHeight: 1
                        }}
                        title="Remove user"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User Input with Suggestions */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={ccUserInput}
                  onChange={(e) => void handleCCUserInputChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type to search users..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocusCapture={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = '#334155';
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && userSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                  >
                    {userSuggestions.map((user) => (
                      <div
                        key={user.email}
                        onClick={() => addCCUser(user)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #334155',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#334155';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
                          {user.displayName}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {user.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Type at least 3 characters to search for users
              </p>
            </div>

            {/* Attachments */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px'
                }}
              >
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
              <label
                htmlFor="attachments"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                <span>📎</span>
                <span>Add Files</span>
              </label>

              {/* File list */}
              {attachments.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.background = '#0f172a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.background = '#1e293b';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        {/* File icon */}
                        <span style={{ fontSize: '20px' }}>{getFileIcon(file.name)}</span>

                        {/* File info */}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: 'white',
                              marginBottom: '2px',
                              wordBreak: 'break-word'
                            }}
                          >
                            {file.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
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
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '20px',
                          padding: '4px 8px',
                          transition: 'all 0.2s',
                          fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#dc2626';
                          e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                {attachments.length > 0
                  ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} attached`
                  : 'Click "Add Files" to attach documents, images, or other files'}
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #334155'
              }}
            >
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
