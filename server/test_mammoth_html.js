const mammoth = require('mammoth');
const fs = require('fs');

const docPath = 'D:\\Test Series\\client\\public\\assets\\Math.docx';

async function test() {
    try {
        const htmlResult = await mammoth.convertToHtml({ path: docPath });
        console.log('HTML Output Length:', htmlResult.value.length);
        console.log(htmlResult.value.substring(0, 2000));
        
        if (htmlResult.messages.length > 0) {
            console.log('Messages:', htmlResult.messages);
        }
    } catch (err) {
        console.error(err);
    }
}

test();
