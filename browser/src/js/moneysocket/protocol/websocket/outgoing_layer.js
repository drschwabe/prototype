// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolLayer =  require("../layer.js").ProtocolLayer;
const WebsocketNexus = require("./nexus.js").WebsocketNexus;
const OutgoingSocket = require("./outgoing_socket.js").OutgoingSocket;


class OutgoingWebsocketLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "OUTGOING_WEBSOCKET");
        this.nexus_by_shared_seed = {};
    }

    announceNexusFromBelowCb(below_nexus) {
        var websocket_nexus = new WebsocketNexus(below_nexus, this);
        this._trackNexus(websocket_nexus, below_nexus);
        this._trackNexusAnnounced(websocket_nexus);

        var shared_seed = websocket_nexus.getSharedSeed();
        this.nexus_by_shared_seed[shared_seed] = websocket_nexus;
        this.notifyAppOfStatus(websocket_nexus, "NEXUS_ANNOUNCED");
        this.announceNexusAboveCb(websocket_nexus);
    }

    ///////////////////////////////////////////////////////////////////////////

    connect(websocket_location, shared_seed) {
        var ws = new OutgoingSocket(websocket_location, shared_seed, this);
    }

    disconnect(shared_seed) {
        if (! (shared_seed in self.nexus_by_shared_seed)) {
            return;
        }
        var websocket_nexus = this.nexus_by_shared_seed[shared_seed];
        websocket_nexus.initiateClose();
    }
}

exports.OutgoingWebsocketLayer = OutgoingWebsocketLayer;
