const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const docPath = 'D:\\Test Series\\client\\public\\assets\\Math.docx';

async function test() {
    try {
        if (!fs.existsSync(docPath)) {
            console.error('File not found:', docPath);
            return;
        }
        console.log('--- Raw Text ---');
        const textResult = await mammoth.extractRawText({ path: docPath });
        console.log(textResult.value.substring(0, 500));
        
        console.log('\n--- HTML ---');
        const htmlResult = await mammoth.convertToHtml({ path: docPath });
        console.log(htmlResult.value.substring(0, 1000));
        
        console.log('\n--- Metadata ---');
        if (textResult.messages.length > 0) {
            console.log('Messages:', textResult.messages);
        }
    } catch (err) {
        console.error(err);
    }
}

test();
