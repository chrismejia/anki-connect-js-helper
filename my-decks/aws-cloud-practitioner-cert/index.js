import AnkiDeck from "../../AnkiDeck.js";

const myDeck = new AnkiDeck();
const deckName = "AWS Cloud Practitioner Cert";

async function run() {
  // Check connection
  const connectionStatus = await myDeck.checkConnection();
  console.log(connectionStatus);

  // Fetch all cards in the deck
  const allDecks = await myDeck.getAllDeckNames();
  console.log(":", allDecks);

  // Fetch a specific card by question
  // const specificCard = await myDeck.getSpecificCardData(deckName, {
  //   fieldName: "Question",
  //   searchVal: "What is Amazon EC2?",
  // });
  // console.log("Specific Card:", specificCard);
}

run();
