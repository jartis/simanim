// Get a list of all the images in "sources" folder
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const { Console } = require('console');

const sources = path.join(__dirname, 'sources');
const images = fs.readdirSync(sources);

const diffs = [];
for (let i = 0; i < images.length; i++) {
  diffs[i] = [];
  for (let j = i + 1; j < images.length; j++) {
    diffs[i][j] = 0;
  }
}

async function compareImages(image1, image2) {
  const Img1 = await Jimp.read(image1)
  const Img2 = await Jimp.read(image2)
  const dist = Jimp.distance(Img1, Img2);
  const { percent } = Jimp.diff(Img1, Img2);
  return percent * dist;
}

async function doCompare() {

  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const dist = await compareImages(path.join(sources, images[i]), path.join(sources, images[j]));
      diffs[i][j] = dist;
      diffs[j][i] = dist;
      console.log(`diff ${i}, ${j}: ${dist}`);
    }
  }

  // Now we have a list of the differences between all the images
  // Build a path of minimal differences that goes through every image once

  const shortpath = findShortestShortestPath(diffs);
  console.log(shortpath);

  // Now we have a list of the images in the order they should be displayed
  // Copy them to "dest" with the filenames as zero-padded names
  const dest = path.join(__dirname, 'dest');
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  for (let i = 0; i < shortpath.length; i++) {
    const filename = shortpath[i].toString().padStart(3, '0') + '.png';
    fs.copyFileSync(path.join(sources, images[shortpath[i]]), path.join(dest, filename));
  }
}

doCompare();

function findShortestPath(diffs) {
  const numImages = diffs.length;
  const visited = new Array(numImages).fill(false);
  visited[0] = true; // Starting from the first image
  const path = [0]; // Start with the first image

  for (let i = 1; i < numImages; i++) {
    let minDistance = 0;
    let nextImage = -1;

    for (let j = 0; j < numImages; j++) {
      if (!visited[j] && diffs[path[path.length - 1]][j] > minDistance) {
        minDistance = diffs[path[path.length - 1]][j];
        nextImage = j;
      }
    }

    if (nextImage !== -1) {
      path.push(nextImage);
      visited[nextImage] = true;
    }
  }

  return path;
}

function findShortestShortestPath(diffs) {
  const numImages = diffs.length;
  let shortestPath = null;
  let shortestPathLength = Infinity;

  for (let startImage = 0; startImage < numImages; startImage++) {
      const visited = new Array(numImages).fill(false);
      visited[startImage] = true;
      const path = [startImage];
      let pathLength = 0;

      for (let i = 1; i < numImages; i++) {
          let minDistance = Infinity;
          let nextImage = -1;

          for (let j = 0; j < numImages; j++) {
              if (!visited[j] && diffs[path[path.length - 1]][j] < minDistance) {
                  minDistance = diffs[path[path.length - 1]][j];
                  nextImage = j;
              }
          }

          if (nextImage !== -1) {
              path.push(nextImage);
              visited[nextImage] = true;
              pathLength += minDistance;
          }
      }

      // Complete the path by adding the distance back to the starting image
      pathLength += diffs[path[path.length - 1]][startImage];

      if (pathLength < shortestPathLength) {
          shortestPathLength = pathLength;
          shortestPath = path;
      }
  }

  return shortestPath;
}
