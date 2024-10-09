# Discord Image Similarity Detector
This project is a Discord bot that detects duplicate images posted in a specific channel. It preprocesses and hashes images, storing the results in a local SQLite database. If a new image is posted similar to a previously posted one, the bot will notify the user and provide a link to the original image.

### Features

* Listens to messages in a specified Discord channel.
* Detects image attachments and processes them.
* Uses perceptual hashing (pHash) to detect duplicate or near-duplicate images.
* Stores hashes and message IDs in a space-efficient way using an SQLite database.
* Notifies the user if a duplicate image is found, linking the original message.

## Setup Instructions
### Prerequisites

* Node.js installed
* A Discord bot token. You can create a bot using the Discord Developer Portal.
* Docker

### Installation

1. Clone the repository

2. Install dependencies:
    ```
    npm install
    ```
3. Create a .env file in the root directory of the project and add the following:
    ```
    DISCORD_TOKEN=your_discord_bot_token_here
    CHANNEL_ID=your_channel_id_here
    ```
4. You're now ready to use the bot!

## Usage

1. Run the bot:
    ```
    node index.js
    ```
2. The bot will log in using the Discord token and listen for new messages in the specified channel. If a message contains an image attachment, the bot will process it and check for duplicates.
3. It will create a database that persists even if the bot shuts down for whatever reason. If you would like to clear the database, please delete the file in the data directory called `image_hashes.db`.

## Image Duplication

* The bot preprocesses images by resizing them to 256x256, converting them to grayscale, and reducing their quality.
* It generates perceptual hashes (pHash) of the images.
* The bot compares the hash of the new image to those stored in the database using the Hamming distance.
* * If a duplicate is detected (Hamming distance below a threshold of 40), the bot will send a message linking to the original image.
