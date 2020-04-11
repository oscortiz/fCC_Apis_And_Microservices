'use strict';

document.addEventListener('DOMContentLoaded', () => {
    let submit = document.getElementById('submit');
    let upfile = document.getElementById('upfile');
    let fileName = document.getElementById('fileName');
    let dropZone = document.getElementById('dropZone');

    dropZone.addEventListener('drop', e => {
        e.stopPropagation();
        e.preventDefault();
        let fileKind = e.dataTransfer.items[0].kind;      
        if (fileKind === 'file') {
            upfile.files = e.dataTransfer.files;  
        }
    }, false);

    dropZone.addEventListener('dragover', e => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, false);  
    
    dropZone.addEventListener('click', e => {
        upfile.click();      
    }, false);

    upfile.addEventListener('change', e => {
        e.stopPropagation();
        e.preventDefault();        
        if (upfile.files.length > 0) {
            fileName.innerHTML = upfile.files[0].name;
            submit.disabled = false;
            dropZone.style.backgroundColor = '#c3d2df';
            dropZone.style.border = 'dashed 3px #888888';
            dropZone.style.color = '#666666'; 
        } 
    }, false);
});