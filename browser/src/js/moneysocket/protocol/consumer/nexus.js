// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Timestamp = require('../../utl/timestamp.js').Timestamp;
const ProtocolNexus = require("../nexus.js").ProtocolNexus;

const RequestProvider = require(
    "../../message/request/provider.js").RequestProvider;
const RequestPing = require("../../message/request/ping.js").RequestPing;


const LAYER_NOTIFICATIONS = new Set(["NOTIFY_PROVIDER",
                                     "NOTIFY_PROVIDER_NOT_READY",
                                     "NOTIFY_PONG",
                                   ]);

class ConsumerNexus extends ProtocolNexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
        console.assert(typeof this.layer.notifyProviderCb == 'function');
        console.assert(typeof this.layer.notifyPingCb == 'function');
        this.consumerFinishedCb = null;
        this.handshake_finished = false;
        this.ping_interval = null;
        this.ping_start_time = null;
    }

    ///////////////////////////////////////////////////////////////////////////

    isLayerMessage(msg) {
        if (msg['message_class'] != "NOTIFICATION") {
            return false;
        }
        return LAYER_NOTIFICATIONS.has(msg['notification_name']);
    }

    recvFromBelowCb(below_nexus, msg) {
        //console.log("consumer nexus got message");
        if (! this.isLayerMessage(msg)) {
            super.recvFromBelowCb(below_nexus, msg)
            return;
        }
        if (msg['notification_name'] == "NOTIFY_PROVIDER") {
            if (! this.handshake_finished) {
                this.handshake_finished = true;
                this.consumerFinishedCb(this);
            }
            this.layer.notifyProviderCb(this, msg);
        } else if (msg['notification_name'] == "NOTIFY_PROVIDER_NOT_READY") {
            console.log("provider not ready, waiting");
        } else if (msg['notification_name'] == "NOTIFY_PONG") {
            var msecs = (Timestamp.getNowTimestamp() -
                         this.ping_start_time) * 1000;
            this.layer.notifyPingCb(this, Math.round(msecs));
            this.ping_start_time = null;
        }
    }

    recvRawFromBelowCb(below_nexus, msg_bytes) {
        //console.log("consumer nexus got raw msg from below");
    }

    startHandshake(consumerFinishedCb) {
        this.consumerFinishedCb = consumerFinishedCb;
        this.send(new RequestProvider());
    }

    startPinging() {
        console.log("START PING");
        this.ping_interval = setInterval(
            function() {
                this.ping_start_time = Timestamp.getNowTimestamp();
                this.send(new RequestPing());
            }.bind(this), 3000);
        this.ping_start_time = Timestamp.getNowTimestamp();
        this.send(new RequestPing());
    }

    stopPinging() {
        console.log("STOP PING");
        clearInterval(this.ping_interval);
        this.ping_interval = null;
    }
}

exports.ConsumerNexus = ConsumerNexus;
