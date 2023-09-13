const addItemButton = document.getElementById('add-item-button');
const itemNameInput = document.getElementById('item-name');
const itemList = document.getElementById('item-list');

addItemButton.addEventListener('click', () => {
    const itemName = itemNameInput.value;
    if (itemName) {
        const listItem = document.createElement('li');
        listItem.innerText = itemName;
        
        const removeButton = document.createElement('button');
        removeButton.innerText = 'Remove';
        removeButton.className = 'remove-item-button';
        removeButton.addEventListener('click', () => {
            itemList.removeChild(listItem);
        });

        listItem.appendChild(removeButton);
        itemList.appendChild(listItem);
        
        itemNameInput.value = '';
    }
});
