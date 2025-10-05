const flags = require('../flags');
function sanitizeQ(q){ if(!q) return ""; return q.replace(/<\s*script/gi,'[blocked]').replace(/alert/gi,'[blocked]'); }
module.exports = function(app, renderTemplate){
  app.get('/search', (req,res)=>{
    const q = typeof req.query.q === 'string' ? req.query.q : "";
    const qSan = sanitizeQ(q);
    const b64 = Buffer.from(flags.STAGE5, 'utf8').toString('base64');
    res.status(200).send(renderTemplate('search.html', {"{{QUERY_RAW}}": qSan, "{{FLAG5_B64}}": b64}));
  });
};
