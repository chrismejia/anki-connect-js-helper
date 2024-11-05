// AnkiDeck.js
import axios from "axios";
import fs from "node:fs";
import path from "path";

class AnkiDeck {
  constructor() {
    this.ANKI_CONNECT_URL = "http://localhost:8765";
    this.delayDuration = 100; // Prevents ECONNRESET errors by allowing for time between requests
    this.ankiDataDir = path.join(
      process.env.APPDATA,
      "Anki2",
      process.env.ANKI_PROFILE
    );
  }

  async _copyDeck(destination) {
    const sourceDeckPath = path.join(this.ankiDataDir, "collection.anki2");
    const sourceMediaPath = path.join(this.ankiDataDir, "media");

    try {
      // Copy the deck file
      await fs.promises.copyFile(
        sourceDeckPath,
        path.join(destination, "collection.anki2")
      );
      console.log("Deck copied to:", destination);

      // Copy the media folder
      await fs.promises.cp(sourceMediaPath, path.join(destination, "media"), {
        recursive: true,
      });
      console.log("Media copied to:", destination);
    } catch (error) {
      console.error("Error copying deck:", error);
    }
  }

  // Private method to introduce a delay
  async _delay() {
    return new Promise((resolve) => setTimeout(resolve, this.delayDuration));
  }

  // Private helper to fetch full card details for given card IDs
  async _fetchCardDetails(cardIds) {
    const response = await axios.post(this.ANKI_CONNECT_URL, {
      action: "cardsInfo",
      version: 6,
      params: { cards: cardIds },
    });
    return response.data.result;
  }

  // Private helper to find card IDs in a specific deck
  async _findCards(deckName) {
    const response = await axios.post(this.ANKI_CONNECT_URL, {
      action: "findCards",
      version: 6,
      params: { query: `deck:"${deckName}"` },
    });
    return response.data.result;
  }

  /**
   * Checks the connection to Anki Connect by requesting its version.
   * @returns {Promise<string>} - The Anki Connect version if successful, or an error message if not.
   */
  async checkConnection() {
    await this._delay();
    try {
      const response = await axios.post(this.ANKI_CONNECT_URL, {
        action: "version",
        version: 6,
      });
      console.log("Connected to Anki Connect. Version:", response.data.result);
      return `Anki Connect Version: ${response.data.result}`;
    } catch (error) {
      console.error("Error connecting to Anki:", error.message);
      return "Failed to connect to Anki Connect. Please ensure Anki is open and Anki Connect is installed.";
    }
  }

  // Public method to trigger the copy operation
  async copyDeckToProject(projectFolder) {
    await this._delay(); // Delay before executing the method
    await this._copyDeck(projectFolder);
  }

  /**
   * Fetch all card data from a specified deck.
   * @param {string} deckName - The name of the Anki deck.
   * @returns {Promise<object[]>} - List of card objects in the deck.
   */
  async getAllCardData(deckName) {
    await this._delay();
    try {
      const cardIds = await this._findCards(deckName);
      if (!cardIds || cardIds.length === 0) {
        console.log(`No cards found in deck: ${deckName}`);
        return [];
      }
      return await this._fetchCardDetails(cardIds);
    } catch (error) {
      console.error(`Error in getAllCardData: ${error.message}`);
      return [];
    }
  }

  /**
   * Lists all available decks in Anki.
   * @returns {Promise<string[]>} - An array of deck names.
   */
  async getAllDeckNames() {
    await this._delay();
    try {
      const response = await axios.post(this.ANKI_CONNECT_URL, {
        action: "deckNames",
        version: 6,
      });
      return response.data.result;
    } catch (error) {
      console.error("Error fetching decks:", error.message);
      return [];
    }
  }

  /**
   * Lists all field names in a given deck.
   * @param {string} deckName - The name of the deck to fetch fields from.
   * @returns {Promise<string[]>} - An array of field names in the specified deck.
   */
  async getFieldNames(deckName) {
    await this._delay();
    try {
      const cardIds = await this._findCards(deckName);
      if (!cardIds || cardIds.length === 0) {
        console.log(`No cards found in deck: ${deckName}`);
        return [];
      }
      const cardDetails = await this._fetchCardDetails(cardIds);
      // Assuming fields are consistent across cards, we can take the first card's fields
      const fields = Object.keys(cardDetails[0].fields);
      return fields;
    } catch (error) {
      console.error(`Error fetching field names: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch a specific card based on a field's value within a deck.
   * @param {string} deckName - The name of the Anki deck.
   * @param {object} searchCriteria - Object with {fieldName, searchVal}.
   * @returns {Promise<object|null>} - The matched card object or null.
   */
  async getSpecificCardData(deckName, { fieldName, searchVal }) {
    await this._delay();
    try {
      const allCards = await this.getAllCardData(deckName);
      return (
        allCards.find((card) => card.fields[fieldName]?.value === searchVal) ||
        null
      );
    } catch (error) {
      console.error(`Error in getSpecificCardData: ${error.message}`);
      return null;
    }
  }
}

export default AnkiDeck;
