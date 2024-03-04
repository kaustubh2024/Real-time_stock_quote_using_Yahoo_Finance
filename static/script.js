/*
This is a program to fetch real-time stock prices and % change 
from yahoo Finance and display in widgets.
It also updates the prices and %s using color coding (Red/Green/Gray)

Use "Add" to add a ticker and "Remove" to remove a widget.
The stock ticker code should be as per Yahoo Finance portal

*/
var tickers = JSON.parse(localStorage.getItem('tickers')) || [];
var lastPrices = {};
var counter = 5;

function startUpdateCycle() {
    updatePrices();
    setInterval(function() {
        counter--;
        $(`#counter`).text(counter);
        if (counter <= 0) {
            updatePrices();
            counter = 5;
        }

    }, 500)

}

$(document).ready(function() {
    
    tickers.forEach(function (ticker) {

        addTickerToGrid(ticker);
    });
    
    updatePrices();

    $(`#add-ticker-form`).submit(function(e) {
        e.preventDefault();
        var newTicker = $(`#new-ticker`).val().toUpperCase();

        if (!tickers.includes(newTicker)) {

            tickers.push(newTicker);
            localStorage.setItem('tickers',JSON.stringify(tickers))
            addTickerToGrid(newTicker);
        } 
        $('#new-ticker').val('');
        updatePrices();
    });

    $(`#tickers-grid`).on('click', '.remove-btn', function() {

        var tickerToRemove = $(this).data(`ticker`);
        tickers = tickers.filter(t => t !== tickerToRemove);
        localStorage.setItem(`tickers`,JSON.stringify(tickers));
        $(`#${tickerToRemove}`).remove();
    
    })

    startUpdateCycle();
});

function addTickerToGrid(ticker) {

    $('#tickers-grid').append(`<div id="${ticker}" class="stock-box"><h2>${ticker}</h2><p id="${ticker}-price"></p><p id="${ticker}-pct"></p><button class="remove-btn" data-ticker="${ticker}">Remove</button></div>`)
}

function updatePrices(){
    tickers.forEach(function (ticker){
        $.ajax({
            url:'/get_stock_data',
            type: 'POST',
            data: JSON.stringify({'ticker':ticker}),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success:function(data) {
                var changePercent = ((data.currentPrice.toFixed(2) - data.openPrice.toFixed(2))/data.openPrice.toFixed(2)) * 100;
                var colorClass;
                if (changePercent <= -2){
                    colorClass = 'dark-red'
                } else if(changePercent < 0){
                    colorClass = 'red'
                } else if (changePercent == 0) {
                    colorClass = 'gray'
                } else if (changePercent <= 2){
                    colorClass = 'green'
                } else {
                    colorClass = 'dark-green'
                }
                var escapedTicker = ticker.replace(/[.^]/g, '\\$&'); // Escape both ^ and 
                $(`#${escapedTicker}-price`).text(`$${data.currentPrice.toFixed(2)}`);

                $(`#${escapedTicker}-pct`).text(`${changePercent.toFixed(2)}%`);
                $(`#${escapedTicker}-price`).removeClass('dark-red red gray green dark-green').addClass(colorClass);

                $(`#${escapedTicker}-pct`).removeClass('dark-red red gray green dark-green').addClass(colorClass);

        
                var flashClass;
                if (lastPrices[escapedTicker] > data.currentPrice){
                    flashClass = 'red-flash';
                } else if (lastPrices[escapedTicker] < data.currentPrice.toFixed(2)) {
                    flashClass = 'green-flash';
                } else {
                    flashClass = 'gray-flash';
                }
                lastPrices[escapedTicker] = data.currentPrice.toFixed(2);
            
                $(`#${escapedTicker}`).addClass(flashClass);

                setTimeout(function(){
                    $(`#${escapedTicker}`).removeClass(flashClass);
                }, 500);
            }
        });
    });
}