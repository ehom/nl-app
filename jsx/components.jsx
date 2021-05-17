function Sentences({ sentences }) {
  const content = sentences.map((sentence) => {
    console.debug("entities in sentence:", sentence.entities);

    let slices = []; // stack
    let salienceMax = 0.0;
    for (let entity of sentence.entities) {
      const curIndex = entity.beginOffset - sentence.text.beginOffset;

      console.debug(
        "slice:",
        sentence.text.content.slice(curIndex, curIndex + entity.content.length)
      );

      if (curIndex !== 0) {
        if (slices.length === 0) {
          console.debug("checkpt 1");
          slices.push({
            text: sentence.text.content.slice(0, curIndex),
            beginOffset: 0,
            endOffset: curIndex,
            isEntity: false
          });
        } else {
          console.debug("checkpt 2");
          slices.push({
            text: sentence.text.content.slice(
              slices[slices.length - 1].endOffset,
              curIndex
            ),
            beginOffset: slices[slices.length - 1].endOffset,
            endOffset: curIndex,
            isEntity: false
          });
        }
      }

      console.debug("checkpt 3: push entity onto stack");
      slices.push({
        text: sentence.text.content.slice(
          curIndex,
          curIndex + entity.content.length
        ),
        beginOffset: curIndex,
        endOffset: curIndex + entity.content.length,
        isEntity: true
      });
    }

    // TODO: Double check this code
    if (slices.length > 0) {
      console.debug("checkpt 4: push end of sentence on the stack");

      slices.push({
        text: sentence.text.content.slice(slices[slices.length - 1].endOffset),
        beginOffset: slices[slices.length - 1].endOffset,
        endOffset: -1,
        isEntity: false
      });
    } else {
      console.debug("checkpt 5: push end of sentence on the stack");
      slices.push({
        text: sentence.text.content,
        beginOffset: 0,
        endOffset: -1,
        isEntity: false
      });
    }

    console.debug("slices:", slices);

    const styling = { fontSize: "13pt" };
    const result = slices.map((slice) => {
      if (slice.isEntity) {
        return (
          <span className="badge badge-pill badge-secondary" style={styling}>
            {slice.text}
          </span>
        );
      } else {
        return <span>{slice.text}</span>;
      }
    });
    return <li className="list-group-item mb-2">{result}</li>;
  });

  return <ul className="list-group">{content}</ul>;
}

function Entities({ entities }) {
  const styling = { fontSize: "13pt" };
  const result = entities.map((entity) => (
    <span className="badge badge-pill badge-secondary m-1" style={styling}>
      {entity.name}
    </span>
  ));
  return <React.Fragment>{result}</React.Fragment>;
}

const EMOJIS = {
  FACE_WITH_ROLLING_EYES: "\ud83d\ude44",
  THINKING_FACE: "\ud83e\udd14",
  FACE_WITH_OPEN_MOUTH: "\ud83d\ude2e",
  NEUTRAL_FACE: "\u{1F610}",
  FROWN_FACE: "\u{1F641}",
  HAPPY_FACE: "\u{1F642}"
};

function Sentiment({ score }) {
  return (
    <React.Fragment>
      {(score > 0.0) ? EMOJIS.HAPPY_FACE :
       (score < 0.0) ? EMOJIS.FROWN_FACE : EMOJIS.NEUTRAL_FACE}
    </React.Fragment>
  );
}