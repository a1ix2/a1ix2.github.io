// Find the first element in list that contains str or is contained in str (case insensitive)
function findIntersecting(list, str) {
    return list.find(el => el.toLowerCase().includes(str.toLowerCase()) || str.toLowerCase().includes(el.toLowerCase()));
}

// For our purposes, a valid date string
// is a string that contains at least year-month-day
// and can be parsed into a valid date object
// This is so we can mix dates and offsets
// when we sort and plot the dose table.
function isValidDateString(dateString) {
    if (typeof dateString !== 'string') {
        return false;
    }
    let date = new Date(dateString);
    if (isNaN(date)) {
        return false;
    }
    let dateParts = dateString.split('-');
    return dateParts.length >= 3;
}

function findEarliestDate(dates) {
    return dates.reduce((earliest, current) => {
        let current_date = isNaN(current) ? new Date(current) : new Date(earliest.getTime() + current * 24 * 60 * 60 * 1000);
        return current_date < earliest ? current_date : earliest;
    }, new Date());
}

function transformToDayOffets(dates) {
    let earliestDate = findEarliestDate(dates);
    return dates.map(date => {
        if (!isValidDateString(date)) {
            return date;
        }
        let currentDate = new Date(date);
        let differenceInTime = currentDate.getTime() - earliestDate.getTime();
        return differenceInTime / (1000 * 3600 * 24);  // Convert milliseconds to days
    });
}

function sortDatesAndOffsets(dates) {
    let offsets = transformToDayOffets(dates);
    return dates
        .map((date, index) => ({ date, offset: offsets[index] }))
        .sort((a, b) => a.offset - b.offset)
        .map(item => item.date);
}

function getMonospaceWidth() {
    let element = document.createElement('pre');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.fontFamily = 'monospace';
    element.textContent = '_';  // 'm' is often used because it's wide
    document.body.appendChild(element);

    // Measure the width of a single monospace character
    let charWidth = element.getBoundingClientRect().width;

    // Remove the off-screen element
    document.body.removeChild(element);

    regionWidth = document.getElementById('e2d3-plot').clientWidth;

    // Calculate and log the width of the window in monospace characters

    return Math.floor(regionWidth / charWidth);

}

function colorBabyBlue(alpha = 1.0) {
    return `rgba(161, 203, 246, ${alpha})`
}

function colorBabyPink(alpha = 1.0) {
    return `rgba(219, 186, 230, ${alpha})`
}

function colorBackground(alpha = 1.0) {
    return `rgba(42, 42, 42, ${alpha})`
}

function colorButton(alpha = 1.0) {
    return `rgba(52, 52, 52, ${alpha})`
}

function unitStep(x) {
    if (x < 0) {
        return 0;
    } else if (x >= 0) {
        return 1;
    }
}

function lngamma(x) { return ieee754gamma.lngamma(x) }

function colorBabyBlue(alpha = 1.0) {
    return `rgba(161, 203, 246, ${alpha})`
}

function colorBabyPink(alpha = 1.0) {
    return `rgba(219, 186, 230, ${alpha})`
}

function loadCSV(files) {
    if (files.length > 0) {
        let file = files[0];
        let reader = new FileReader();

        reader.onload = function (event) {
            Papa.parse(event.target.result, {
                complete: function (results) {
                    deleteAllRows('dose-table');
                    results.data.forEach(function (csvrow) {
                        if (csvrow.length >= 3) {
                            let ester = findIntersecting(esterList, csvrow[2].replace(/\s/g, '').replace(/im/gi, ''));

                            if (ester && (isFinite(csvrow[0]) || isValidDate(csvrow[0])) && isFinite(csvrow[1])) {
                                let row = addTDERow('dose-table')
                                let timeCell = row.cells[0];
                                let doseCell = row.cells[1];
                                let esterSelector = row.cells[2];

                                timeCell.querySelector('input').value = csvrow[0];
                                doseCell.querySelector('input').value = parseFloat(csvrow[1]);
                                esterSelector.querySelector('select').value = ester;
                            }
                        }
                    });
                    refresh();
                }
            });
        };

        reader.readAsText(file);
    }
}

function exportCSV() {
    let table = document.getElementById('dose-table');
    let rows = Array.from(table.rows);
    let data = [['time (days)', 'dose (mg)', 'ester']].concat(rows.slice(1).map(row => {
        let timeValue = row.cells[0].querySelector('input').value;
        let doseValue = row.cells[1].querySelector('input').value;
        let esterValue = row.cells[2].querySelector('select').value;
        return [timeValue, doseValue, esterValue];
    }));
    console.log(data)
    let csvContent = Papa.unparse(data);

    let downloadLink = document.createElement('a');
    downloadLink.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent);
    downloadLink.download = 'dose-table.csv';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


function addTDERow(id, stationary = false) {
    let table = document.getElementById(id);
    let row = table.insertRow(-1);

    let visibilityCell = row.insertCell(0);
    let visibilityCheckbox = document.createElement('input');
    visibilityCheckbox.type = 'checkbox';
    visibilityCheckbox.className = 'hidden-checkbox';
    visibilityCell.appendChild(visibilityCheckbox);

    let visibilityCustomCheckbox = document.createElement('div');
    visibilityCustomCheckbox.className = 'custom-checkbox';
    visibilityCustomCheckbox.onclick = function() {
        visibilityCheckbox.checked = !visibilityCheckbox.checked;
        this.className = visibilityCheckbox.checked ? 'custom-checkbox checked' : 'custom-checkbox';
    };
    visibilityCell.appendChild(visibilityCustomCheckbox);

    let uncertaintyCell = row.insertCell(1);
    let uncertaintyCheckbox = document.createElement('input');
    uncertaintyCheckbox.type = 'checkbox';
    uncertaintyCheckbox.className = 'hidden-checkbox';
    uncertaintyCell.appendChild(uncertaintyCheckbox);

    let uncertaintyCustomCheckbox = document.createElement('div');
    uncertaintyCustomCheckbox.className = 'custom-checkbox';
    uncertaintyCustomCheckbox.onclick = function() {
        uncertaintyCheckbox.checked = !uncertaintyCheckbox.checked;
        this.className = uncertaintyCheckbox.checked ? 'custom-checkbox checked' : 'custom-checkbox';
    };
    uncertaintyCell.appendChild(uncertaintyCustomCheckbox);



    let timeCell = row.insertCell(2)
    timeCell.innerHTML = '<input type="text" class="flat-input time-cell" oninput="refresh()">';
    // timeCell.addClassName = "time-cell";

    let doseCell = row.insertCell(3)
    doseCell.innerHTML = '<input type="text" class="flat-input dose-cell" oninput="refresh()">';
    // doseCell.addClassName = "dose-cell";

    let esterSelector = row.insertCell(4).innerHTML =
        '<select class="dropdown-ester" onchange="refresh()"> \
            <option value="EV IM">EV IM</option> \
            <option value="EEn IM">EEn IM</option> \
            <option value="EC IM">EC IM</option> \
            <option value="EB IM">EB IM</option> \
            <option value="EUn IM">EUn IM</option> \
            </select>';

    let deleteCell = row.insertCell(5);
    deleteCell.innerHTML = '<button class="flat-button delete-button">-</button>';
    deleteCell.querySelector('.delete-button').addEventListener('click', function () {
        this.parentNode.parentNode.remove();
        refresh();
    });

    if (stationary) {
        document.getElementById('add-dose-button').scrollIntoView();
    }
    
    return row;
}

function deleteAllRows(id) {
    let table = document.getElementById(id);
    while (table.rows.length > 1) {
        table.deleteRow(-1);
    }
    refresh();
}

function attachDragnDrop() {

    let doseTable = document.getElementById('dose-table');
    doseTable.addEventListener('dragenter', function (event) {
        doseTable.classList.add('overlay');
    });

    doseTable.addEventListener('dragleave', function (event) {
        if (event.relatedTarget === null || !doseTable.contains(event.relatedTarget)) {
            doseTable.classList.remove('overlay');
        }
    });

    doseTable.addEventListener('dragover', function (event) {
        event.preventDefault();
    });

    doseTable.addEventListener('drop', function (event) {
        event.preventDefault();
        doseTable.classList.remove('overlay');
        let files = event.dataTransfer.files;
        loadCSV(files)
    });

}

function changeBackgroundColor(elementId, color1, color2, delay = 100) {
    let element = document.getElementById(elementId);
    element.style.backgroundColor = color1;

    setTimeout(function () {
        element.style.backgroundColor = color2;
    }, delay);
}