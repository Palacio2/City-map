export interface RodoModalProps {
  readonly onAccept: () => Promise<void> | void;
  readonly onDecline: () => void;
}