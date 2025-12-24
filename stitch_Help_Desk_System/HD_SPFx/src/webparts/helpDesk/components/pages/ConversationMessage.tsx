import * as React from 'react';
import { IConversation, MessageType } from '../../models';
import {
  getUserColorIndex,
  getBorderRadiusClass,
  formatMessageTime,
  getFileIcon
} from './ConversationHelpers';
import pageStyles from './TicketDetailsPage.module.scss';

interface IConversationMessageProps {
  conversation: IConversation;
  currentUserId: number | undefined;
  isConsecutive: boolean;
  hasNextConsecutive: boolean;
  canSendInternalNotes: boolean;
}

/**
 * ConversationMessage Component
 * Renders a single message in the conversation thread
 */
export const ConversationMessage: React.FC<IConversationMessageProps> = ({
  conversation,
  currentUserId,
  isConsecutive,
  hasNextConsecutive,
  canSendInternalNotes
}) => {
  const isOwnMessage = conversation.SentById === currentUserId;
  const isSystemMessage = conversation.MessageType === MessageType.System;
  const isInternalNote = conversation.MessageType === MessageType.Internal;

  // Hide internal notes from regular users
  if (isInternalNote && !canSendInternalNotes) {
    return null;
  }

  // System messages have special styling
  if (isSystemMessage) {
    return (
      <div className={pageStyles.systemMessage}>
        <div dangerouslySetInnerHTML={{ __html: conversation.Message }} />
      </div>
    );
  }

  const userColorIndex = getUserColorIndex(conversation.SentById || 0);
  const borderRadiusClass = getBorderRadiusClass(
    isOwnMessage,
    isConsecutive,
    hasNextConsecutive
  );

  // Determine message bubble classes
  const bubbleClasses = [
    pageStyles.messageBubble,
    (pageStyles as any)[borderRadiusClass] || ''
  ];

  if (isInternalNote) {
    bubbleClasses.push(pageStyles.internalNote);
  } else if (isOwnMessage) {
    bubbleClasses.push(pageStyles.ownMessageBubble);
  }

  return (
    <div
      className={`${pageStyles.messageRow} ${isOwnMessage ? pageStyles.ownMessage : ''
        } ${isConsecutive ? pageStyles.consecutive : pageStyles.notConsecutive}`}
    >
      {/* Avatar - only show for first message in group */}
      {!isConsecutive ? (
        <div
          className={pageStyles.avatar}
          data-user-color={userColorIndex}
        >
          {(conversation.SentByName || 'U').charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className={`${pageStyles.avatar} ${pageStyles.hidden}`} />
      )}

      <div
        className={`${pageStyles.messageContent} ${isOwnMessage ? pageStyles.alignRight : pageStyles.alignLeft
          }`}
      >
        {/* Name and Time - only show for first message in group */}
        {!isConsecutive && (
          <div
            className={`${pageStyles.messageHeader} ${isOwnMessage ? pageStyles.reverseDirection : ''
              }`}
          >
            <span className={pageStyles.senderName}>
              {conversation.SentByName}
            </span>
            <span className={pageStyles.messageTime}>
              {formatMessageTime(new Date(conversation.SentDate))}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={bubbleClasses.join(' ')}
          data-bubble-color={isOwnMessage ? undefined : userColorIndex}
        >
          {/* Internal Note Badge */}
          {isInternalNote && (
            <div className={pageStyles.internalNoteBadge}>
              🔒 Internal Note
            </div>
          )}

          {/* Message Text */}
          <div
            className={pageStyles.messageText}
            dangerouslySetInnerHTML={{ __html: conversation.Message }}
          />

          {/* Attachments */}
          {conversation.AttachmentFiles &&
            conversation.AttachmentFiles.length > 0 && (
              <div className={pageStyles.attachmentsContainer}>
                {conversation.AttachmentFiles.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.ServerRelativeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pageStyles.attachmentLink}
                  >
                    <span className={pageStyles.fileIcon}>
                      {getFileIcon(file.FileName)}
                    </span>
                    <span>{file.FileName}</span>
                  </a>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
