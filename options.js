let selectedFolderName = null;

// Create a tree item element
function createTreeItem(node, isRoot = false) {
  const item = document.createElement('div');
  
  if (!node.children) {
    return null; // Skip non-folder items
  }
  
  const itemContent = document.createElement('div');
  itemContent.className = 'tree-item';
  if (!isRoot) {
    itemContent.dataset.folderName = node.title;
  }
  
  // Add toggle arrow if has children folders
  const hasChildFolders = node.children.some(child => child.children);
  if (hasChildFolders) {
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.textContent = '▼';
    toggle.onclick = (e) => {
      e.stopPropagation();
      toggleChildren(item, toggle);
    };
    itemContent.appendChild(toggle);
    itemContent.classList.add('has-children');
  } else if (!isRoot) {
    const spacer = document.createElement('span');
    spacer.className = 'tree-toggle';
    spacer.textContent = ' ';
    itemContent.appendChild(spacer);
  }
  
  // Add folder icon
  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = '📁';
  itemContent.appendChild(icon);
  
  // Add folder name
  const name = document.createElement('span');
  name.textContent = node.title || 'Bookmarks';
  itemContent.appendChild(name);
  
  item.appendChild(itemContent);
  
  // Add click handler for selection (not on root)
  if (!isRoot) {
    itemContent.onclick = (e) => {
      // Only select if not clicking the toggle
      if (!e.target.classList.contains('tree-toggle')) {
        selectFolder(itemContent, node.title);
      }
    };
  }
  
  // Create children container
  if (hasChildFolders) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    
    node.children.forEach(child => {
      const childItem = createTreeItem(child);
      if (childItem) {
        childrenContainer.appendChild(childItem);
      }
    });
    
    item.appendChild(childrenContainer);
  }
  
  return item;
}

// Toggle children visibility
function toggleChildren(item, toggle) {
  const children = item.querySelector('.tree-children');
  
  if (children) {
    children.classList.toggle('collapsed');
    if (toggle) {
      toggle.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
    }
  }
}

// Select a folder
function selectFolder(element, folderName) {
  // Remove previous selection
  document.querySelectorAll('.tree-item.selected').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Add selection to clicked item
  element.classList.add('selected');
  selectedFolderName = folderName;
  
  // Enable save button
  document.getElementById('saveButton').disabled = false;
}

// Load all bookmark folders and build the tree
function loadBookmarkFolders() {
  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const treeContainer = document.getElementById('folderTree');
    treeContainer.innerHTML = '';
    
    bookmarkTreeNodes.forEach(rootNode => {
      const treeElement = createTreeItem(rootNode, true);
      if (treeElement) {
        // For root node, append its children directly
        const children = treeElement.querySelectorAll(':scope > .tree-children > div');
        children.forEach(child => {
          treeContainer.appendChild(child);
        });
      }
    });
    
    // Load previously saved folder and select it
    chrome.storage.sync.get(['selectedFolder'], (result) => {
      if (result.selectedFolder) {
        selectedFolderName = result.selectedFolder;
        
        // Find and select the saved folder
        document.querySelectorAll('.tree-item').forEach(item => {
          if (item.dataset.folderName === result.selectedFolder) {
            item.classList.add('selected');
            document.getElementById('saveButton').disabled = false;
            
            // Expand parent folders to show the selected item
            let parent = item.parentElement;
            while (parent) {
              if (parent.classList.contains('tree-children')) {
                parent.classList.remove('collapsed');
                const parentItem = parent.parentElement;
                const toggle = parentItem?.querySelector('.tree-toggle');
                if (toggle) {
                  toggle.textContent = '▼';
                }
              }
              parent = parent.parentElement;
            }
          }
        });
      }
    });
  });
}

// Save the selected folder
function saveSettings() {
  if (!selectedFolderName) {
    showStatus('Please select a folder', false);
    return;
  }
  
  chrome.storage.sync.set({ selectedFolder: selectedFolderName }, () => {
    showStatus('Settings saved successfully!', true);
  });
}

// Show status message
function showStatus(message, isSuccess) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + (isSuccess ? 'success' : 'error');
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadBookmarkFolders();
  document.getElementById('saveButton').addEventListener('click', saveSettings);
});