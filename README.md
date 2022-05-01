# Editaverse Project.

## Getting Started with Editaverse Project.

#### To get the local copy of the project up and running you will need to run the following commands on your terminal:


```
npm install // Installing the node modules
```

```
npm run start // To run the project
```

Open `https://localhost:9090`

#### Installation 

- Install a MetaMask chrome extension that will allow to connnect the block chain with a personal account and actually interact with a smart contract. Or for accessing Ethereum enabled distributed applications, or "Dapps" in your browser! 

## What is the goal of the project?

Right now, users can build worlds in Blender and export them to Webaverse. It's fine, but not easy to use for most people who just want a world to play.

Webaverse is an open source 3D world platform where users can play and interact with their avatars and voice chat. Naturally, we need an easy way for users to quickly build and edit worlds without having to know any complicated 3D software, and ideally right in the browser without having to download anything.

To solve this problem, we looked to those who came before us. Mozilla Spoke is a familiar interface for anyone who's used Hubs and familiar enough for users of software like Unreal and Unity3D. We forked Spoke and made... Editaverse.

## History of Editaverse

This project was started by an engineer who is no longer working at Webaverse, although he's cool and still around the web3 space. Editaverse was his idea to quickly hackathon an editor out of Spoke still using Mozilla's deployed infrastructure, notably Reticulum, which is their API server, which in turn connects to their database, etc.

We inherited the project as is, connecting to the existing infrastructure deployed by Mozilla for Hubs. However, that means using their API systems instead of our own, and at some point this would become a limitation and that we'd need to remove Reticulum entirely.

Luckily the creator of Spoke wanted things to be exstensible, so he kept (nearly all) of the Reticulum calls in the Api.ts file.

## What do we need to do?
Ideally this project grows to be a smooth 3D editor experience that is integrated with Webaverse entirely, and doesn't have any differentiation. We may even migrate the project into the core app repo so that it can easily be switched into from the UI.

However, we're not there yet. Right now we want to make sure that it serves the utility as a viable place option for users to edit and create scenes easily and hang out in them in Webaverse.

### Remove Reticulum and replace with Webaverse APIs
We don't want to use Reticulum at all. If Webaverse doesn't have the APIs we should add. Most likely for scene editing CRUD we want to create or update the metadata on NFTs. NFTs can contain entire JSON files, zip files or worlds.

### Remove sketchfab and other external APIs
We aren't gonna use these in Webaverse. We don't need YouTube, twitch, Sketchfab, giphy, or any of that. We don't need 3D prefab models. Eventually we will show public models that are allowed for use in the Webaverse marketplace but we're not there yet.

### Login integration
Users should be able to login with Metamask or Discord, using the Webaverse APIs.

### Publishing scenes
Since scenes are stored as NFTs in the wallet, we want logged in users to be able to view their inventory of scenes and edit or update. We want to make sure when the user goes to publish scene we give them the option to update an existing scene, or we track what scene they're on currently and update it automatically.

### Asset Uploading and Inventory integration
We want to give users the ability to drop their other tokens into their scenes. In theory, a scene is just a collection of 3D models and a few settings and non-asset objects. So if a user uploads a model it actually mints that model first as it's own asset, adds it to the inventory of the user, then adds that to the scene. This makes 3D models composable across scenes and removes the burden to have a secondary upload outside of what Webaverse does.

### Editing inventory assets
Right now we can edit inventory asset metadata with the Webaverse bot. We want that functionality when we click "details" on an asset, so that when we upload it, we can change the name etc, or view in more detail.

### Deploy Editaverse
We need Editaverse deployed with CI/CD to Amazon, and we need to be able to hand this over to Webaverse to deploy. IPFS deployment on Fleek could be awesome if we can static build.

