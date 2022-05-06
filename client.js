// grab relevant DOM elements
const showResults = document.getElementById('results')
const getButton = document.getElementById('get-button')
const setButton = document.getElementById('set-button')

//Use Promise object and manage accordingly https://javascript.info/promise-basics
// Call NodeJS to grab the value of the smart contract variable.
function getValue() {
    fetch('/get-value', { method: 'GET' })
        .then((response) => {
            response.json()
                .then((data) => {
                    console.log(data);
                    showResults.innerHTML = data; // Update results section
                })
        })
}

// Link the action to the button click
getButton.addEventListener('click', () => {
    getValue();
});

// If "Set" button is clicked, send the input-field value to NodeJS
setButton.addEventListener('click', () => {
    var amount = document.getElementById("input-field").value;
    fetch('/set-value', {
        method: 'PUT',
        body: JSON.stringify({ inputField: amount }),
        headers: { 'Content-Type': 'application/json' }
    }).then((response) => {
        response.text() // format of the message is text.
            .then((body) => {
                console.log(body); // check console for troubleshooting
                showResults.innerHTML = "Updated";
                //getValue();
            })
    })
})