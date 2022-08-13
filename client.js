// grab relevant DOM elements
const showResults = document.getElementById('results')
const getButton = document.getElementById('get-button')
const setButton = document.getElementById('set-button')
var mainButton = document.getElementById('dropdownMenuButton')
const ethereumSelect = document.getElementById('firstMenuOption')
const solanaSelect = document.getElementById('secondMenuOption')
var chain = {
    "chain": "none"
};

// Choosing the chain to operate on
ethereumSelect.addEventListener('click', ()=>{
    mainButton.innerText = ethereumSelect.innerText;
    chain['chain'] = ethereumSelect.innerText; // any changes should be made on the HTML page
});

solanaSelect.addEventListener('click', ()=>{
    mainButton.innerText = solanaSelect.innerText;
    chain['chain'] = solanaSelect.innerText; // any changes should be made on the HTML page
});


async function getValue() {
    response = await fetch('/get-value?chain='+chain['chain'], { method: 'GET' })
    data = await response.text() // Response type is a blob
    console.log(data)
    showResults.innerText = data
}

async function setValue(val){
    response = await fetch('/set-value?chain='+chain['chain'], {
       method: 'PUT',
       body: JSON.stringify({ inputField : val }),
       headers: { 'Content-Type': 'application/json' }
    }) 
    body = await response.text() // response type is a blob
    showResults.innerText = body;
}

// Link the action to the button click
getButton.addEventListener('click', () => {
    getValue();
});

// If "Set" button is clicked, send the input-field value to NodeJS
setButton.addEventListener('click', () => {
    var val = document.getElementById("input-field").value;
    showResults.innerText = "waiting..."
    setValue(val)
})

