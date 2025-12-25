import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TicketService, ConversationService } from '../../services';
import { ITicket, IConversation, MessageType, TicketStatus } from '../../models';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorMessage } from '../shared/ErrorMessage';
import { AssignTicketModal } from '../modals/AssignTicketModal';
import { SLACalculator } from '../../utils/SLACalculator';
import { ConversationMessage } from './ConversationMessage';
import { groupMessagesByDate, getFileIcon, formatFileSize } from './ConversationHelpers';
import pageStyles from './TicketDetailsPage.module.scss';

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
  const [isMarkingResponded, setIsMarkingResponded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const loadTicketData = async (isPolling = false, shouldScroll = false): Promise<void> => {
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

      const hasNewMessages = conversationsData.length > conversations.length;

      // Only update conversations if count changed (to avoid unnecessary re-renders)
      if (!isPolling || hasNewMessages) {
        setConversations(conversationsData);

        // Only scroll if explicitly requested (like after sending a message)
        // or if there are new messages during polling AND we're currently near the bottom
        if (shouldScroll || (isPolling && hasNewMessages)) {
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

      // If ticket is in Waiting status and user is a regular user (not technician/manager),
      // automatically change status to Open when they send a message
      if (ticket?.Status === 'Waiting' && !currentUser?.IsManager && !currentUser?.IsTechnician) {
        await TicketService.updateTicketStatus(ticketId, TicketStatus.Open);
      }

      await ConversationService.addMessage({
        TicketId: ticketId,
        Message: message.trim() || '(File attachment)',
        IsInternal: isInternal,
        Attachments: attachments
      });

      setMessage('');
      setAttachments([]);
      setIsInternal(false);

      // Reload ticket data and conversations with scroll
      await loadTicketData(false, true);

      setIsSending(false);
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

  const handleMarkAsResponded = async (): Promise<void> => {
    try {
      setIsMarkingResponded(true);

      // Update ticket status from Waiting to Open
      await TicketService.updateTicketStatus(ticketId, TicketStatus.Open);

      // Reload ticket data to reflect the status change (don't scroll)
      await loadTicketData(false, false);

      setIsMarkingResponded(false);
    } catch (err) {
      console.error('Error marking ticket as responded:', err);
      setIsMarkingResponded(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading ticket details..." />;
  }

  if (error || !ticket) {
    return <ErrorMessage message={error || 'Ticket not found'} onRetry={loadTicketData} />;
  }

  const canSendInternalNotes = !!(currentUser?.IsTechnician || currentUser?.IsManager);

  return (
    <div className={pageStyles.pageContainer}>
      {/* Header */}
      <div className={pageStyles.headerSection}>
        <Button variant="secondary" size="small" onClick={() => onNavigate('/')}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Ticket Header Card */}
      <Card className={pageStyles.ticketHeaderCard}>
        <div className={pageStyles.ticketHeader}>
          <div className={pageStyles.ticketHeaderTop}>
            <div>
              <div className={pageStyles.ticketMetadata}>
                <span className={pageStyles.ticketNumber}>
                  {ticket.TicketNumber}
                </span>
                <Badge text={ticket.Status} type="status" value={ticket.Status} />
                <Badge text={ticket.Priority} type="priority" value={ticket.Priority} />
              </div>
              <h1 className={pageStyles.ticketTitle}>
                {ticket.Title}
              </h1>
              <div className={pageStyles.ticketInfo}>
                <span>Created {SLACalculator.formatRelativeTime(ticket.Created)}</span>
                {ticket.RequesterName && <span>by {ticket.RequesterName}</span>}
                {ticket.CategoryTitle && <span>{ticket.CategoryTitle}</span>}
              </div>
            </div>

            <div className={pageStyles.headerActions}>
              {/* Show "Mark as Responded" button for regular users when ticket is in Waiting status */}
              {ticket.Status === 'Waiting' && !currentUser?.IsManager && !currentUser?.IsTechnician && (
                <Button
                  onClick={handleMarkAsResponded}
                  disabled={isMarkingResponded}
                  variant="primary"
                >
                  {isMarkingResponded ? 'Updating...' : '✓ Mark as Responded'}
                </Button>
              )}

              {/* Show Assign/Reassign button for managers and technicians */}
              {(currentUser?.IsManager || currentUser?.IsTechnician) && (
                <Button onClick={() => setShowAssignModal(true)}>
                  {ticket.AssignedToName ? 'Reassign' : 'Assign Ticket'}
                </Button>
              )}
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className={pageStyles.ticketDetailsGrid}>
            <div className={pageStyles.detailItem}>
              <div className={pageStyles.label}>Assigned To</div>
              <div className={pageStyles.value}>
                {ticket.AssignedToName || 'Unassigned'}
              </div>
            </div>
            <div className={pageStyles.detailItem}>
              <div className={pageStyles.label}>Impact</div>
              <div className={pageStyles.value}>{ticket.Impact}</div>
            </div>
            <div className={pageStyles.detailItem}>
              <div className={pageStyles.label}>Urgency</div>
              <div className={pageStyles.value}>{ticket.Urgency}</div>
            </div>
          </div>

          {/* Description */}
          <div className={pageStyles.ticketDescription}>
            <div className={pageStyles.descriptionLabel}>
              Description
            </div>
            <div
              className={pageStyles.descriptionContent}
              dangerouslySetInnerHTML={{ __html: ticket.Description }}
            />
          </div>
        </div>
      </Card>

      {/* Conversation Thread */}
      <Card>
        <div className={pageStyles.conversationCard}>
          <h2 className={pageStyles.conversationTitle}>
            Conversation
          </h2>

          {/* Messages */}
          <div className={pageStyles.messagesContainer}>
            {conversations.length === 0 ? (
              <div className={pageStyles.emptyState}>
                <div className={pageStyles.emptyIcon}>💬</div>
                <p>No messages yet. Start the conversation below.</p>
              </div>
            ) : (
              <>
                {groupMessagesByDate(conversations).map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Date Separator */}
                    <div className={pageStyles.dateSeparator}>
                      {group.date}
                    </div>

                    {/* Messages for this date */}
                    {group.messages.map((conv: IConversation, msgIndex: number) => {
                      // Check if previous message is from the same user
                      const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                      const isConsecutive = prevMsg &&
                        prevMsg.SentById === conv.SentById &&
                        prevMsg.MessageType !== MessageType.System;

                      // Check if next message is from the same user
                      const nextMsg = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
                      const hasNextConsecutive = nextMsg &&
                        nextMsg.SentById === conv.SentById &&
                        nextMsg.MessageType !== MessageType.System;

                      return (
                        <ConversationMessage
                          key={conv.Id}
                          conversation={conv}
                          currentUserId={currentUser?.Id}
                          isConsecutive={!!isConsecutive}
                          hasNextConsecutive={!!hasNextConsecutive}
                          canSendInternalNotes={canSendInternalNotes}
                        />
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          {ticket?.AssignedToId || currentUser?.IsManager ? (
            <div className={pageStyles.messageInputSection}>
              {canSendInternalNotes && (
                <div className={pageStyles.internalNoteCheckbox}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    <span className={pageStyles.checkboxLabel}>
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
                className={`${pageStyles.messageTextarea} ${isInternal ? pageStyles.internalBorder : ''}`}
              />

              {/* Attachments Input */}
              <input
                id="message-attachments"
                type="file"
                multiple
                onChange={handleFileChange}
                className={pageStyles.attachmentsInput}
              />

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className={pageStyles.attachmentsList}>
                  {attachments.map((file, index) => (
                    <div key={index} className={pageStyles.attachmentItem}>
                      <div className={pageStyles.fileInfo}>
                        <span className={pageStyles.fileIcon}>{getFileIcon(file.name)}</span>
                        <span className={pageStyles.fileName}>{file.name}</span>
                        <span className={pageStyles.fileSize}>
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className={pageStyles.removeButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className={pageStyles.actionButtons}>
                <label htmlFor="message-attachments" className={pageStyles.attachButton}>
                  📎 Attach Files
                </label>
                <div className={pageStyles.buttonContainer}>
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
            <div className={pageStyles.conversationDisabled}>
              <p className={pageStyles.disabledMessage}>
                💬 Conversation will be enabled once the ticket is assigned to a technician
              </p>
              {currentUser?.IsManager && (
                <div className={pageStyles.assignButtonContainer}>
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
