// Configuration: Set your bookmark folder name here
const FOLDER_NAME = "Dushyant"; // Change this to your folder name

// Get all bookmarks from a specific folder by name
async function getBookmarksFromFolderByName(folderName) {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      let targetFolder = null;
      
      // Recursive function to find folder by name
      function findFolder(nodes) {
        for (const node of nodes) {
          if (node.title === folderName && node.children) {
            targetFolder = node;
            return true;
          }
          if (node.children && findFolder(node.children)) {
            return true;
          }
        }
        return false;
      }
      
      findFolder(bookmarkTreeNodes);
      
      if (!targetFolder) {
        resolve([]);
        return;
      }
      
      // Get only bookmarks (items with URLs) from the folder
      const bookmarks = targetFolder.children.filter(item => item.url);
      resolve(bookmarks);
    });
  });
}

// Open a random bookmark in the current tab
async function openRandomBookmark() {
  const bookmarks = await getBookmarksFromFolderByName(FOLDER_NAME);
  
  if (bookmarks.length === 0) {
    console.error(`No bookmarks found in folder: ${FOLDER_NAME}`);
    return;
  }
  
  // Pick a random bookmark
  const randomIndex = Math.floor(Math.random() * bookmarks.length);
  const randomBookmark = bookmarks[randomIndex];
  
  // Get the current active tab and update its URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: randomBookmark.url });
    }
  });
}

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(() => {
  openRandomBookmark();
});