import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TicketService, ConversationService } from '../../services';
import { ITicket, IConversation, MessageType } from '../../models';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { AssignTicketModal } from '../modals/AssignTicketModal';
import { SLACalculator } from '../../utils/SLACalculator';
import styles from '../../styles/common.module.scss';

interface ITicketDetailsPageProps {
  ticketId: number;
  onNavigate: (route: string) => void;
}

/**
 * TicketDetailsPage Component
 * Full ticket details with conversation thread
 */
export const TicketDetailsPage: React.FC<ITicketDetailsPageProps> = ({ ticketId, onNavigate }) => {
  const { currentUser } = useAppContext();
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const loadTicketData = async (isPolling = false): Promise<void> => {
    try {
      if (!isPolling) {
        setIsLoading(true);
        setError(undefined);
      }

      const [ticketData, conversationsData] = await Promise.all([
        TicketService.getTicketById(ticketId),
        ConversationService.getConversationsByTicketId(ticketId)
      ]);

      setTicket(ticketData);

      // Only update conversations if count changed (to avoid unnecessary re-renders)
      if (!isPolling || conversationsData.length !== conversations.length) {
        setConversations(conversationsData);

        // Scroll to bottom if new messages
        if (conversationsData.length > conversations.length) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }

      if (!isPolling) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading ticket:', err);
      if (!isPolling) {
        setError('Failed to load ticket details. Please try again.');
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadTicketData();

    // Start polling for new messages every 5 seconds
    pollingIntervalRef.current = window.setInterval(() => {
      void loadTicketData(true);
    }, 5000); // Poll every 5 seconds

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, [ticketId]);

  const handleSendMessage = async (): Promise<void> => {
    if (!message.trim() && attachments.length === 0) {
      return;
    }

    try {
      setIsSending(true);

      await ConversationService.addMessage({
        TicketId: ticketId,
        Message: message.trim() || '(File attachment)',
        IsInternal: isInternal,
        Attachments: attachments
      });

      setMessage('');
      setAttachments([]);
      setIsInternal(false);

      // Reload conversations
      const updatedConversations = await ConversationService.getConversationsByTicketId(ticketId);
      setConversations(updatedConversations);

      setIsSending(false);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number): void => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  if (isLoading) {
    return <LoadingSpinner message="Loading ticket details..." />;
  }

  if (error || !ticket) {
    return <ErrorMessage message={error || 'Ticket not found'} onRetry={loadTicketData} />;
  }

  const canSendInternalNotes = currentUser?.IsTechnician || currentUser?.IsManager;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button variant="secondary" size="small" onClick={() => onNavigate('/')}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Ticket Header Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
                  {ticket.TicketNumber}
                </span>
                <Badge text={ticket.Status} type="status" value={ticket.Status} />
                <Badge text={ticket.Priority} type="priority" value={ticket.Priority} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                {ticket.Title}
              </h1>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#94a3b8' }}>
                <span>Created {SLACalculator.formatRelativeTime(ticket.Created)}</span>
                {ticket.RequesterName && <span>by {ticket.RequesterName}</span>}
                {ticket.CategoryTitle && <span>• {ticket.CategoryTitle}</span>}
              </div>
            </div>

            {(currentUser?.IsManager || currentUser?.IsTechnician) && (
              <Button onClick={() => setShowAssignModal(true)}>
                {ticket.AssignedToName ? 'Reassign' : 'Assign Ticket'}
              </Button>
            )}
          </div>

          {/* Ticket Details Grid */}
          <div className={styles.grid3} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Assigned To</div>
              <div style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>
                {ticket.AssignedToName || 'Unassigned'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Impact</div>
              <div style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>{ticket.Impact}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Urgency</div>
              <div style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>{ticket.Urgency}</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
              Description
            </div>
            <div
              style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: ticket.Description }}
            />
          </div>
        </div>
      </Card>

      {/* Conversation Thread */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '20px' }}>
            Conversation
          </h2>

          {/* Messages */}
          <div
            style={{
              maxHeight: '500px',
              overflowY: 'auto',
              marginBottom: '20px',
              padding: '16px',
              background: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #1e293b'
            }}
          >
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                <p>No messages yet. Start the conversation below.</p>
              </div>
            ) : (
              <>
                {conversations.map((conv) => {
                  const isOwnMessage = conv.SentById === currentUser?.Id;
                  const isSystemMessage = conv.MessageType === MessageType.System;
                  const isInternalNote = conv.MessageType === MessageType.Internal;

                  if (isInternalNote && !canSendInternalNotes) {
                    return null; // Hide internal notes from regular users
                  }

                  return (
                    <div
                      key={conv.Id}
                      style={{
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: isSystemMessage ? 'column' : (isOwnMessage ? 'row-reverse' : 'row'),
                        gap: '12px',
                        alignItems: isSystemMessage ? 'center' : 'flex-start'
                      }}
                    >
                      {!isSystemMessage && (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isOwnMessage ? '#3b82f6' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 600,
                            flexShrink: 0
                          }}
                        >
                          {(conv.SentByName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div
                        style={{
                          maxWidth: isSystemMessage ? '80%' : '70%',
                          background: isSystemMessage ? 'transparent' : (isInternalNote ? '#78350f' : (isOwnMessage ? '#1e40af' : '#1e293b')),
                          padding: isSystemMessage ? '4px 8px' : '12px 16px',
                          borderRadius: isSystemMessage ? '6px' : '12px',
                          border: isSystemMessage ? 'none' : (isInternalNote ? '1px solid #f59e0b' : '1px solid #334155')
                        }}
                      >
                        {!isSystemMessage && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
                              {conv.SentByName}
                              {isInternalNote && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f59e0b', fontWeight: 500 }}>
                                  🔒 Internal Note
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {SLACalculator.formatRelativeTime(conv.SentDate)}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: isSystemMessage ? '11px' : '14px',
                            color: isSystemMessage ? '#64748b' : 'white',
                            lineHeight: isSystemMessage ? '1.3' : '1.5',
                            fontStyle: isSystemMessage ? 'italic' : 'normal',
                            textAlign: isSystemMessage ? 'center' : 'left'
                          }}
                          dangerouslySetInnerHTML={{ __html: conv.Message }}
                        />

                        {/* Attachments */}
                        {conv.AttachmentFiles && conv.AttachmentFiles.length > 0 && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                            {conv.AttachmentFiles.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.ServerRelativeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px',
                                  background: 'rgba(0,0,0,0.2)',
                                  borderRadius: '6px',
                                  textDecoration: 'none',
                                  color: '#60a5fa',
                                  fontSize: '13px',
                                  marginBottom: '6px'
                                }}
                              >
                                <span style={{ fontSize: '18px' }}>{getFileIcon(file.FileName)}</span>
                                <span>{file.FileName}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          {ticket?.AssignedToId || currentUser?.IsManager ? (
            <div>
              {canSendInternalNotes && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 500 }}>
                      🔒 Internal Note (Only visible to technicians and managers)
                    </span>
                  </label>
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && !isSending) {
                    void handleSendMessage();
                  }
                }}
                placeholder={isInternal ? 'Add an internal note...' : 'Type your message...'}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1e293b',
                  border: `1px solid ${isInternal ? '#f59e0b' : '#334155'}`,
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />

            {/* Attachments */}
            <input
              id="message-attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {attachments.length > 0 && (
              <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{getFileIcon(file.name)}</span>
                      <span style={{ fontSize: '13px', color: 'white' }}>{file.name}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0 8px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <label
                htmlFor="message-attachments"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#334155',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  border: '1px solid #475569'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#334155';
                }}
              >
                📎 Attach Files
              </label>
              <div style={{ flex: 1 }}>
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || (!message.trim() && attachments.length === 0)}
                >
                  {isSending ? 'Sending...' : 'Send Message (Ctrl+Enter)'}
                </Button>
              </div>
            </div>
          </div>
          ) : (
            <div style={{
              padding: '20px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                💬 Conversation will be enabled once the ticket is assigned to a technician
              </p>
              {currentUser?.IsManager && (
                <div style={{ marginTop: '8px' }}>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => setShowAssignModal(true)}
                  >
                    Assign Ticket
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignTicketModal
          ticketId={ticket.Id}
          ticketTitle={ticket.Title}
          currentAssigneeId={ticket.AssignedToId}
          currentAssigneeName={ticket.AssignedToName}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            void loadTicketData();
          }}
        />
      )}
    </div>
  );
};
