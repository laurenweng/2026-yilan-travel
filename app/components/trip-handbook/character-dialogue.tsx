import Image from "next/image";
import {
  getDialogueCharacterPresentation,
  type DialogueCharacter,
} from "../../lib/dialogue-character";

type CharacterDialogueProps = {
  character: DialogueCharacter;
  children: React.ReactNode;
  className: string;
};

export const CharacterDialogue = ({
  character,
  children,
  className,
}: CharacterDialogueProps) => {
  const presentation = getDialogueCharacterPresentation(character);

  return (
    <div className={`character-dialogue character-dialogue--${character} ${className}`}>
      <div className="character-dialogue-bubble">
        <p>{children}</p>
      </div>
      <Image
        alt=""
        className="character-dialogue-artwork"
        height={presentation.height}
        src={presentation.source}
        unoptimized
        width={presentation.width}
      />
    </div>
  );
};
