const express = require('express')
const app = express()
const port = 10000
const {exec} = require("child_process");
const { spawn } = require('child_process');

const log = require('simple-node-logger').createSimpleLogger('/var/log/super_user_api.log');

app.get('/', (req, res) => {
    res.redirect("http://lara-host.ir");
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

app.get('/exec', (req, res) => {
    var site_name = req.query.site_name;
    var command = req.query.command;

    var args = ['exec',  site_name].concat(command.split(" "));
    const newProc = spawn('docker', args);

    var result ;
    newProc.on('error', (err) => {
        console.log(`error: ${err.message}`);
        var result = JSON.stringify({
            success: false,
            data: `${err.message}`,
        });
        res.send(result);
        return;
    });

    newProc.on('close', (code) => {
        console.log(`close: ${code}`);
        var result = JSON.stringify({
            success: false,
        });
        res.send(result);
        return;
    });

    newProc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        var result = JSON.stringify({
            success: false,
            data: `${data}`,
        });
        res.send(result);
        return;
    });

    newProc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        var result = JSON.stringify({
            success: true,
            data: `${data}`,
        });
        res.send(result);
        return;
    });

    newProc.on('exit', () => {
        res.end();
        return;
    });

})

//backward compatibility
app.get('/remove_site', (req, res) => {
    var email = req.query.email;
    var site_name = req.query.site_name;
    execCommand("rm -rf /home/repos/" + email + "/" + site_name , res);
})

app.get('/remove_domain_config', (req, res) => {
    var domain = req.query.domain;
    execCommand("rm -rf /etc/nginx/conf.d/" + "/" + domain + ".conf", res);
})

app.get('/remove_dir', (req, res) => {
    var dir = req.query.dir;
    execCommand("rm -rf " + dir, res);
})

app.get('/generate_key_pair', (req, res) => {
    var email = req.query.email;
    var output_dir = req.query.output_dir;
    execCommand('ssh-keygen -t rsa -b 4096 -C "' + email + '" -f ' + output_dir + '/id_rsa -P ""', res);
})

app.get('/restart_container', (req, res) => {
    var container_name = req.query.container_name;
    execCommand('docker restart ' + container_name, res);
})

app.get('/ping', (req, res) => {
    var result = JSON.stringify({
        success: true,
        data: 'ok',
    });
    res.send(result);
})

app.get('/new_folder', (req, res) => {
    var path = req.query.path;
    execCommand('mkdir -p ' + path, res);
})

//backward compatibility
app.get('/new_file', (req, res) => {
    var file_name = req.query.file_name;
    var content = req.query.content;

    fs = require('fs');
    fs.writeFile(file_name, content);

    var result = JSON.stringify({
        success: true,
        data: "file created",
    });
    res.send(result);
})

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.post('/put_contents',(req, res) => {
    var file_name = req.body.file_name;
    var content = req.body.content;

    fs = require('fs');
    fs.writeFile(file_name, content);

    var result = JSON.stringify({
        success: true,
        data: "contents saved",
    });
    res.send(result);
})

app.get('/bind_domain', (req, res) => {
    fs = require('fs');

    var domain = req.query.domain;
    let partial_config = fs.readFileSync(__dirname +  "/dns.partial.config",'utf8');
    let bind_config = fs.readFileSync(__dirname+ "/dns_config.template",'utf8');

    partial_config = partial_config.replace(/\$domain/g,domain);
    bind_config = bind_config.replace(/\$domain/g,domain);

    fs.writeFile("/var/named/" + domain + ".db", bind_config);
    fs.appendFile("/etc/named.conf", partial_config);

    var result = JSON.stringify({
        success: true,
        data: "/var/named/" + domain + ".db " + " created",
    });
    res.send(result);
})

app.get('/reload_dns', (req, res) => {
    execCommand("service named reload", res);
})

app.listen(port, () => {
    console.log(`Example app listening at http://127.0.0.1:${port}`)
})

function execCommand(command, res) {
    exec(command, (error, stdout, stderr) => {
        log.info(command);
        if (error) {
            log.error(`error: ${error.message}`)
            var result = JSON.stringify({
                success: false,
                data: error.message,
            });
            res.send(result);
            return;
        }
        if (stderr) {
            log.error(`stderr: ${stderr}`)
            var result = JSON.stringify({
                success: false,
                data: stderr,
            });
            res.send(result);
            return;
        }
        log.info(`stdout: ${stdout}`)
        var result = JSON.stringify({
            success: true,
            data: stdout,
        });
        res.send(result);
    });

}
