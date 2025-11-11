import { Input } from '@components/input/input';
import { Whistle } from '@components/whistle/whistle';
import type { WhistleProps } from '@components/whistle/whistle';

type WhistleReplyModalProps = {
  whistle: WhistleProps;
  closeModal: () => void;
};

export function WhistleReplyModal({
  tweet,
  closeModal
}: WhistleReplyModalProps): JSX.Element {
  return (
    <Input
      modal
      replyModal
      parent={{ id: tweet.id, username: tweet.user.username }}
      closeModal={closeModal}
    >
      <Whistle modal parentWhistle {...whistle} />
    </Input>
  );
}
