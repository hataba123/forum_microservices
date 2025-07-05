// Enums dùng chung trong toàn bộ ứng dụng

// Enum cho user roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

// Enum cho user status
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  PENDING = 'PENDING',
}

// Enum cho vote types
export enum VoteType {
  THREAD = 'THREAD',
  POST = 'POST',
}

// Enum cho vote values
export enum VoteValue {
  UPVOTE = 1,
  DOWNVOTE = -1,
}

// Enum cho thread status
export enum ThreadStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  DELETED = 'DELETED',
}

// Enum cho notification types
export enum NotificationType {
  NEW_POST = 'NEW_POST',
  POST_QUOTED = 'POST_QUOTED',
  POST_VOTED = 'POST_VOTED',
  THREAD_VOTED = 'THREAD_VOTED',
  MENTION = 'MENTION',
}

// Enum cho media types
export enum MediaType {
  IMAGE = 'IMAGE',
  AVATAR = 'AVATAR',
  ATTACHMENT = 'ATTACHMENT',
}
