export type CallDirection = 'outgoing' | 'incoming' | 'missed';

export type CallRecord = {
  id: string;
  name: string;
  number: string;
  direction: CallDirection;
  timeLabel: string;
  durationLabel?: string;
};
