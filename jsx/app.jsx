const EMOJIS = {
  FACE_WITH_ROLLING_EYES: "\ud83d\ude44",
  THINKING_FACE: "\ud83e\udd14",
  FACE_WITH_OPEN_MOUTH: "\ud83d\ude2e"
};

class App extends React.Component {
  state = {
    original: {},
    sentences: [],
    entities: [],
    salienceMin: 0.0,
    salienceMax: 0.0,
    salience: 0.01
  };

  combine(sentences, entities) {
    console.debug("sentences:", sentences);
    console.debug("entities:", entities);

    const textOffsets = sentences
      .map((sentence) => sentence.text.beginOffset)
      .reverse();

    console.debug("offsets:", textOffsets);

    sentences.forEach((s) => {
      s.entities = new Array();
    });

    // Go through entities and put them in the right spot in entitiesPerSentence
    // O(n^3)

    for (let entity of entities) {
      for (let mention of entity.mentions) {
        const { content, beginOffset } = mention.text;

        console.debug("text:", content);
        console.debug("beginOffset: ", beginOffset);

        for (let index = 0; index < textOffsets.length; index++) {
          if (beginOffset >= textOffsets[index]) {
            const sentenceIndex = sentences.length - 1 - index;

            console.debug(
              "put this entity mention in sentence #",
              sentenceIndex
            );

            sentences[sentenceIndex].entities.push(mention.text);
            break;
          }
        }
      }
    }
    console.debug("sentences with entities:", sentences);

    // sort the mentions in each sentence
    sentences.forEach((sentence) => {
      sentence.entities.sort((mention1, mention2) => {
        return mention1.beginOffset > mention2.beginOffset;
      });
    });

    console.debug("sentences with entities:", sentences);

    return sentences;
  }

  isImportant = (entity) => entity.salience >= this.state.salience;

  componentDidMount() {
    console.debug("componentDidMount");

    fetch(this.props.url)
      .then((response) => response.json())
      .then((json) => {
        console.debug(json);

        const entities = json.entities.filter((entity) =>
          this.isImportant(entity)
        );

        const sentences = this.combine(json.sentences, entities);

        const salienceMax = json.entities.reduce((currentMax, entity) => {
          return Math.max(currentMax, entity.salience);
        }, 0.0);

        this.setState({
          original: json,
          sentences: sentences,
          entities: entities,
          salienceMax: salienceMax
        });

        document.getElementById(
          "salience"
        ).value = this.state.salience.toString();
      });
  }

  rangeHandler(event) {
    console.debug("rangeHandler():", event.target.value);
  }

  onSalience(event) {
    console.debug("onSalience():", event.target.value);

    // TODO -- Put this in a method so that it can be shared with componentDidMount()

    const entities = this.state.original.entities.filter((entity) =>
      this.isImportant(entity)
    );

    const sentences = this.combine(this.state.original.sentences, entities);

    this.setState({
      sentences: sentences,
      entities: entities,
      salience: parseFloat(event.target.value)
    });
  }

  render() {
    console.debug("render");

    if (this.state.sentences.length === 0) {
      return null;
    }

    const sentences = this.state.sentences;

    console.debug("render sentences:", sentences);

    const FACES = [
      EMOJIS.FACE_WITH_ROLLING_EYES,
      EMOJIS.THINKING_FACE,
      EMOJIS.FACE_WITH_OPEN_MOUTH
    ];
    
    const style = { borderWidth: "1", borderColor: "LightGray", borderStyle: "solid"}

    return (
      <div className="pb-5 mb-5">
        <nav class="navbar navbar-light bg-light mb-3">
          <span className="navbar-brand">Entity Recognition</span><span className="text-muted"> 0.3</span>
        </nav>
        <main className="container mb-5">
          <div class="row mb-2">
            <div className="col-sm-6 bg-white text-right p-3 mb-2" style={style}>
              Google Cloud NL has identified important entities in this document.
            </div>
            <div className="col-sm-6 bg-white text-center pt-4 pb-1 mb-2">
              <label for="salience">
                <input
                  id="salience"
                  type="range"
                  min={this.state.salienceMin}
                  max={this.state.salienceMax}
                  value={this.state.salience}
                  step="0.001"
                  onChange={this.onSalience.bind(this)}
                  className="form-range"
                />
              </label>
            </div>
          </div>
          <div className="mb-3">
            <Sentences sentences={sentences} />
          </div>
          <div className="container bg-white p-3">
            <p>Entities ({this.state.entities.length})</p>
            <Entities entities={this.state.entities} />
          </div>
        </main>
        <footer className="mb-5">
          <ul className="list-group">
            <li className="list-group-item">
              <a
                href="?url=https://raw.githubusercontent.com/ehom/nl-api-demo/main/result.json"
                target="_blank"
              >
                Covid-19
              </a>
            </li>
            <li className="list-group-item">
              <a
                href="?url=https://raw.githubusercontent.com/ehom/nl-api-demo/main/cyberattack.json"
                target="_blank"
              >
                Colonial Pipeline
              </a>
            </li>
          </ul>
        </footer>
      </div>
    );
  }
}

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
        begineOffset: 0,
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

const DEFAULT_URL =
  "https://raw.githubusercontent.com/ehom/nl-api-demo/main/result.json";

let url = DEFAULT_URL;
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has("url")) {
  url = urlParams.get("url");
  console.debug("url:", url);
}

ReactDOM.render(<App url={url} />, document.getElementById("root"));
