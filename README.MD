#Terminator config genrator from JSON


Will generate a valid Terminator (https://github.com/gnome-terminator/terminator) config file from JSON specifications.

Allows some basic command templating and spreading evenly many elements.

See the json_examples for details on the json syntax.

```bash
npm install
npx tsc
node index.js < your_config.json > ~/.config/terminator/config```