var price_last; //最後一根k線
var price_last_open;
var stock_number = 0000; //股票代號變數。預設股票代號為0000
var refresh = false;
//  需要回傳的變數 : 回傳stock_number和mode來獲取json檔

function change_data(data) {
    new_data = [];
    var cnt = 0;
    for (var i = 0; i < data.length; i++) {
        new_data.push({
            x: new Date(data[i].Date),
            y: [data[i].Open, data[i].High, data[i].Low, data[i].Close,]
        });
        cnt++;
    }
    return new_data;
}

function change_data_2(data) {
    new_data = []
    var cnt = 0;
    for (var i = 0; i < data.length; i++) {
        new_data.push({
            x: new Date(data[i].Date),
            // y: data[i].Volume * (data[0].Close / (20 * data[0].Volume)),
            y: data[i].Volume / 1000000,
        });
        cnt++;
    }
    return new_data;
}

//畫k線圖
window.onload = function () {
    var dps = JSON.parse('{{ stock_data | tojson | safe}}');
    console.log(dps.length);
    console.log(dps[dps.length - 1].Open);
    console.log(dps[dps.length - 1].Close);
    console.log(change_data(dps));

    //設定k線的形式
    var chart = new CanvasJS.Chart("chartholder", {
        animationEnabled: true,
        exportEnabled: true,
        zoomEnabled: true,
        title: { //標題
            text: "Stock Price"
        },
        axisX: { //x軸
            valueFormatString: "DD MMM YYYY"
        },
        axisY: { //y軸
            title: "Price (in NTD)",
            prefix: "$"
        },
        data: [{
            risingColor: "red",
            fallingColor: "green",
            type: "candlestick",
            xValueFormatString: "DD MMM YYYY",
            yValueFormatString: "$#,##0.00",
            xValueType: "dateTime",
            dataPoints: change_data(dps) //上面有宣告一個空陣列 dps[]，用來儲存收到的資料 (可改，但須連下方dps.push()一起)
        }]
    });
    chart.render();
    price_last = dps[dps.length - 1].Close; //收盤價為最後一筆資料 [開盤,最高,最低,收盤]的第3位
    price_last_open = dps[dps.length - 1].Open;

    var chart2 = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        theme: "light1", // "light1", "light2", "dark1", "dark2"
        title: {
            text: ""
        },
        axisX: { //x軸
            valueFormatString: "DD MMM YYYY"
        },
        axisY: {
            title: "Volume (10^6)"
        },
        data: [{
            color: "#FCB5AC",
            type: "column",
            xValueFormatString: "DD MMM YYYY",
            showInLegend: false,
            dataPoints: change_data_2(dps)
        }]
    });
    chart2.render();

    show();
}


const table = document.querySelector('#history_table'); //history_table 為 table
const table2 = document.querySelector('#select_table'); //select_table 為 table2
var j = 0; //add_select()的counter，算有加幾個進selection


//計算當日價差
function calculate_price_change() {
    var price_change = 0;
    price_change = (price_last - price_last_open).toFixed(2);
    return price_change;
}

//history table裡的設定
function show() {
    //由 '{{}}' 為 flask 支援的參數型式，能夠在 render template(網頁) 時傳入後台參數
    var num = '{{stock_number}}';
    var price_change = calculate_price_change();
    //order 為網頁發出的request次數；設定 cookie 可以避免 JS 參數在網頁刷新後消失；coolie 以 "key=value" 型式儲存
    document.cookie = "ele"+'{{ order }}'+".1" + "=" + '{{ order }}';
    document.cookie = "ele"+'{{ order }}'+".2" + "=" + num;
    document.cookie = "ele"+'{{ order }}'+".3" + "=" + price_last.toFixed(2);
    document.cookie = "ele"+'{{ order }}'+".4" + "=" + price_change;
    var counter = 1;

    //倒序儲存之前存入的 cookie
    while (('{{ order }}' - counter) > 0){
        var row = table.insertRow(4);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(-1);
        //在 cookie 中透過 key 值搜尋對應 value
        cell1.innerHTML = document.cookie.match('(^|;)\\s*' + ("ele"+counter+".1") + '\\s*=\\s*([^;]+)')?.pop() || '';
        cell2.innerHTML = document.cookie.match('(^|;)\\s*' + ("ele"+counter+".2") + '\\s*=\\s*([^;]+)')?.pop() || '';
        cell3.innerHTML = document.cookie.match('(^|;)\\s*' + ("ele"+counter+".3") + '\\s*=\\s*([^;]+)')?.pop() || '';
        cell4.innerHTML = document.cookie.match('(^|;)\\s*' + ("ele"+counter+".4") + '\\s*=\\s*([^;]+)')?.pop() || '';
        counter += 1;
    }
}

//selection table裡的設定
function add_select() {
    var num = '{{stock_number}}';

    var row = table2.insertRow(4);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(-1);

    var price_change = calculate_price_change();

    cell1.innerHTML = j + 1;
    cell2.innerHTML = num;
    cell3.innerHTML = price_last.toFixed(2);
    cell4.innerHTML = price_change;
    j += 1;
}