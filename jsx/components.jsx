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
          slices.push({
            text: sentence.text.content.slice(0, curIndex),
            beginOffset: 0,
            endOffset: curIndex,
            isEntity: false
          });
        } else {
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
      slices.push({
        text: sentence.text.content.slice(slices[slices.length - 1].endOffset),
        beginOffset: slices[slices.length - 1].endOffset,
        endOffset: -1,
        isEntity: false
      });
    } else {
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