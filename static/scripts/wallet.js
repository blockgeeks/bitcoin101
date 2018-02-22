
// Create New Wallet button click
$("#create-wallet").click(function() {
    $("#old-wallet").hide();
    $("#new-wallet").show();
    $("#output-area").html("");
})

// Network selection and Create button click
$("#new-wallet-form").on('submit', function(e) {
    e.preventDefault(e);
    var network = $('input[name=network]:checked').val();

    //TODO: Create New Wallet

    $('#new-wallet-form')[0].reset();
    $('#new-wallet').hide();
    $('#output-area').html(generateNewWalletInfo());
})

// New wallet confirmation button click
$('#output-area').on('click', '#confirm-key', function(e) {
    $('#output-area').html(generateWalletUI());
})


// Handle sending of transaction
$('#output-area').on('click', '#tx-form button', function(e) {
    e.preventDefault(e);

    var amount = $('input[name="btc"]').val();
    var addr = $('input[name="addr"]').val();

    //TODO: send actual transaction

    displayAlert("danger", "Unable to send " + amount + " to " + addr);
})

// Import Existing Wallet button click
$('#import-wallet').click(function() {
    $("#old-wallet").show();
    $("#new-wallet").hide();
    $("#output-area").html("");
})

// Private key unlock button click
$('#old-wallet-form').on('submit', function(e) {
    e.preventDefault(e);
    var key = $('input[name="cipher"]').val();

    //TODO: Import wallet from key

    $('#old-wallet-form')[0].reset();
    $('#old-wallet').hide();
    $('#output-area').html(generateWalletUI());
})

//==============================
// Helper Functions
//==============================

function displayAlert(type, msg) {
    var alert = `
        <div class='alert alert-dismissible alert-${type}'>
            <p>${msg}</p>
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
        </div>
    `;
    $('#alert-msg').append(alert);
}

function generateNewWalletInfo() {
    //TODO: display real private key
    var html = `
        <h4>Save your private key and DO NOT lose it!</h4>
        <div class='key-info'>1234</div>
        <button id='confirm-key' type='submit' class='btn btn-secondary'>Ok, got it!</button>
    `;
    return html;
}


function generateWalletUI() {
    //TODO: Display actualy balance and address
    var html = `
        <h5 id='btc-balance'>Balance: 0</h5>
        <h5>Address: 0x123456789</h5>
        <h5>Send Transaction</h5>
        <form id='tx-form'>
            <div class='form-group'>
                <input type='number' min='0' step='any' name='btc' placeholder='Amount in BTC' class='form-control'>
                <input type='text' name='addr' placeholder='Recipient Address' class='form-control'>
            </div>
            <button type='submit' class='btn btn-secondary'>Send Bitcoin</button>
        </form>
    `;

    return html;
}