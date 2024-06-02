const { sendInteractionResponse } = require("../commands")

module.exports = {
    name: "board",
    description: "Create a board",
    run: (interaction, command) => {
        console.log("run", interaction, command);
        let i = 0;
        const button = () => ({
            type: 2,
            label: "\u00AD",
            style: 1,
            custom_id: `${command.id}-${i++}`
        })
        const row = () => ({
            type: 1,
            components: new Array(3).fill().map(button)
        });
        sendInteractionResponse(interaction, {
            type: 4,
            data: {
                components: new Array(3).fill().map(row)
            }
        }).then( response => {
            console.log("Interaction response\n", response);
        });
    },
    interactions: [
        (interaction, command) => {
            if (!interaction.data.custom_id?.startsWith?.(command.id)) return;
            console.log("clicked board button");
            const components = interaction.message.components;
            for (let row of components) {
                for (let button of row.components) {
                    if (interaction.data.custom_id === button.custom_id) {
                        button.disabled = true;
                    }
                }
            }
            sendInteractionResponse(interaction, {
                type: 7,
                data: {
                    components
                }
            });
        }
    ]
}