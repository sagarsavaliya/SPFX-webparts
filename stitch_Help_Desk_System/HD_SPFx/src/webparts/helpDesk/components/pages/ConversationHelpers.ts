/**
 * Conversation UI Helper Functions
 * Utility functions for managing conversation styles and behavior
 */

/**
 * Get user color index based on user ID
 * Returns a consistent color index (0-9) for each user
 */
export const getUserColorIndex = (userId: number): number => {
  return userId % 10;
};

/**
 * Get the appropriate border radius class based on message position
 * @param isOwnMessage - Whether the message is from the current user
 * @param isConsecutive - Whether previous message is from same user
 * @param hasNextConsecutive - Whether next message is from same user
 * @returns CSS class name for border radius
 */
export const getBorderRadiusClass = (
  isOwnMessage: boolean,
  isConsecutive: boolean,
  hasNextConsecutive: boolean
): string => {
  if (isOwnMessage) {
    // Right-aligned messages (own messages)
    if (isConsecutive && hasNextConsecutive) {
      return 'radiusMiddleRight'; // Middle message
    } else if (isConsecutive && !hasNextConsecutive) {
      return 'radiusLastRight'; // Last message in group
    } else if (!isConsecutive && hasNextConsecutive) {
      return 'radiusFirstRight'; // First message in group
    } else {
      return 'radiusSingle'; // Single message
    }
  } else {
    // Left-aligned messages (other users)
    if (isConsecutive && hasNextConsecutive) {
      return 'radiusMiddleLeft'; // Middle message
    } else if (isConsecutive && !hasNextConsecutive) {
      return 'radiusLastLeft'; // Last message in group
    } else if (!isConsecutive && hasNextConsecutive) {
      return 'radiusFirstLeft'; // First message in group
    } else {
      return 'radiusSingle'; // Single message
    }
  }
};

/**
 * Format date as "Wednesday, July 26th"
 */
export const formatDateSeparator = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  const formattedDate = date.toLocaleDateString('en-US', options);

  // Add ordinal suffix (st, nd, rd, th)
  const day = date.getDate();
  const suffix =
    ['th', 'st', 'nd', 'rd'][((day % 100) - 20) % 10] ||
    ['th', 'st', 'nd', 'rd'][day % 100] ||
    'th';

  return formattedDate.replace(/\d+/, `${day}${suffix}`);
};

/**
 * Format time as "09:03 AM"
 */
export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get file icon emoji based on file extension
 */
export const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📽️';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️';
    case 'zip':
    case 'rar':
      return '📦';
    default:
      return '📎';
  }
};

/**
 * Format file size in KB
 */
export const formatFileSize = (bytes: number): string => {
  return `${(bytes / 1024).toFixed(1)} KB`;
};

/**
 * Group messages by date
 * Groups conversation messages by their date for display
 */
export interface IMessageGroup {
  date: string;
  messages: any[];
}

export const groupMessagesByDate = (messages: any[]): IMessageGroup[] => {
  const groups: { [key: string]: any[] } = {};

  messages.forEach(msg => {
    const date = new Date(msg.SentDate);
    const dateKey = date.toLocaleDateString('en-US');

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
  });

  const result: IMessageGroup[] = [];
  for (const key in groups) {
    if (groups.hasOwnProperty(key)) {
      result.push({
        date: formatDateSeparator(new Date(groups[key][0].SentDate)),
        messages: groups[key]
      });
    }
  }
  return result;
};
