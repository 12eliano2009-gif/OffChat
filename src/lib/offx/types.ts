export type Money = string;

export type Profile = {
  userId: string;
  displayName: string;
  handle: string;
  avatarHue: number;
  avatarUrl: string | null;
  bio: string;
  walletBalance: Money;
  isSystem: boolean;
  emailVerified: boolean;
};

export type ConversationSummary = {
  id: string;
  other: Profile;
  lastMessageAt: string;
  lastMessagePreview: string;
  unread: boolean;
};

export type PaymentKind = "send" | "request" | "topup" | "cashout";
export type PaymentStatus = "pending" | "completed" | "declined";

export type Payment = {
  id: string;
  conversationId: string | null;
  senderId: string;
  recipientId: string;
  amount: Money;
  fee: Money;
  net: Money;
  euroPaid: Money | null;
  currency: string;
  note: string;
  kind: PaymentKind;
  status: PaymentStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "payment" | "image";
  body: string;
  imageUrl: string | null;
  createdAt: string;
  payment: Payment | null;
};

export type ThreadPayload = {
  conversationId: string;
  other: Profile;
  me: Profile;
  messages: ChatMessage[];
};

export type PostKeep = "network" | "profile" | "leave";

export type FeedPost = {
  author: Profile;
  id: string;
  caption: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  likedBy: string[];
  /** Where this post lives. Missing means profile (older posts). */
  keep?: PostKeep;
};

export type Comment = {
  id: string;
  postId: string;
  author: Profile;
  body: string;
  createdAt: string;
};

export type WalletSnapshot = {
  profile: Profile;
  transactions: Payment[];
};
