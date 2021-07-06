const express = require('express')
const app = express()
const port = 10000
const {exec} = require("child_process");


app.get('/', (req, res) => {
    res.send('Super User API');
})

app.get('/compose_up', (req, res) => {
    var compose_dir = req.query.compose_dir;
    var site_name = req.query.site_name;
    execCommand("cd " + compose_dir + ";docker-compose --project-name " + site_name + " up -d", res);
})

app.get('/compose_down', (req, res) => {
    var compose_dir = req.query.compose_dir;
    var site_name = req.query.site_name;
    execCommand("cd " + compose_dir + ";docker-compose --project-name " + site_name + " down", res);
})

app.get('/reload_nginx', (req, res) => {
    execCommand("/usr/sbin/nginx -s reload", res);
})

app.get('/inspect', (req, res) => {
    var site_name = req.query.site_name;
    execCommand("docker inspect " + site_name, res);
})

app.get('/remove_site', (req, res) => {
    var email = req.query.email;
    var site_name = req.query.site_name;
    var queries = "rm -rf /home/repos/" + email + "/" + site_name + ";";
    queries += "rm -rf /etc/nginx/conf.d/" + "/" + site_name + ".conf;";
    execCommand(queries, res);
})

app.listen(port, () => {
    console.log(`Example app listening at http://0.0.0.0:${port}`) //TODO: make it 127.0.0.1
})

function execCommand(command, res) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            var result = JSON.stringify({
                success: false,
                data: error.message,
            });
            res.send(result);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            var result = JSON.stringify({
                success: false,
                data: stderr,
            });
            res.send(result);
            return;
        }
        console.log(`stdout: ${stdout}`);
        var result = JSON.stringify({
            success: true,
            data: stdout,
        });
        res.send(result);
    });

}