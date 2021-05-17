const versionString = "0.4";

class App extends React.Component {
  state = {
    original: {},
    sentences: [],
    entities: [],
    salienceMin: 0,
    salienceMax: 0,
    salienceIndex: 0,
    saliences: []
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
    // Time: O(n^3)
    // Space: O(number of entity-mentions) ???

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

  componentDidMount() {
    console.debug("componentDidMount");

    fetch(this.props.url)
      .then((response) => response.json())
      .then((json) => {
        console.debug(json);

        const saliences = json.entities.map(entity => {
          return entity.salience;
        }).sort();

        const salienceMax = saliences.length - 1;

        const entities = json.entities.filter((entity) =>
          entity.salience >= saliences[salienceMax]
        );

        const sentences = this.combine(json.sentences, entities);

        this.setState({
          original: json,
          sentences: sentences,
          entities: entities,
          salienceMax: salienceMax,
          salienceIndex: salienceMax,
          saliences: saliences
        });
      });
  }

  onSalience(event) {
    console.debug("onSalience():", event.target.value);

    const salienceIndex = parseInt(event.target.value);
    // TODO -- Put this in a method so that it can be shared with componentDidMount()?

    const entities = this.state.original.entities.filter((entity) =>
       entity.salience >= this.state.saliences[salienceIndex]
    );

    const sentences = this.combine(this.state.original.sentences, entities);

    this.setState({
      sentences: sentences,
      entities: entities,
      salienceIndex: salienceIndex
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
    
    const style = { borderWidth: "1", borderColor: "LightGray", borderStyle: "solid", backgroundColor: "#ffffcc"};

    return (
      <div className="pb-5 mb-5">
        <nav class="navbar navbar-light bg-light mb-3">
          <span className="badge badge-dark">Entity Recognition</span><span className="badge badge-pill badge-dark"> {versionString}</span>
        </nav>
        <main className="container mb-5">
          <div class="row mb-2">
            <div className="col-sm-4 text-right p-3 mb-2" style={style}>
              Google Cloud NL has identified important entities in this document.
            </div>
            <div className="col-sm-8 bg-white text-center pt-4 pb-1 mb-2">
              <label for="salience">
                <input
                  id="salience"
                  type="range"
                  min={this.state.salienceMin}
                  max={this.state.salienceMax}
                  value={this.state.salienceIndex}
                  step="1"
                  onChange={this.onSalience.bind(this)}
                  className="form-range"
                />
              </label>
              <span className="badge badge-pill">{this.state.salienceIndex + 1}</span>
            </div>
          </div>
          <div className="mb-3">
            <Sentences sentences={sentences} />
          </div>
          <div className="container bg-white p-3 mb-3">
            <p>Entities ({this.state.entities.length})</p>
            <Entities entities={this.state.entities} />
          </div>
          <div className="container bg-white p-3">
            <p>Document Sentiment ({this.state.original.documentSentiment.score})</p>
            <div className="display-4">
              <Sentiment score={this.state.original.documentSentiment.score} />
            </div>
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

App.defaultProps = {
  url: "https://raw.githubusercontent.com/ehom/nl-api-demo/main/result.json"
};

const urlParams = new URLSearchParams(window.location.search);

ReactDOM.render(<App url={ urlParams.has('url') ? urlParams.get("url") : undefined} />, document.getElementById("root"));
