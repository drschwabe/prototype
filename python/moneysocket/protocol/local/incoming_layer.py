# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from moneysocket.protocol.layer import ProtocolLayer
from moneysocket.protocol.local.nexus import LocalNexus


class IncomingLocalLayer(ProtocolLayer):
    def __init__(self, app, above_layer):
        super().__init__(app, above_layer)

    def announce_nexus_from_below_cb(self, below_nexus):
        local_nexus = LocalNexus(below_nexus, self)
        self._track_nexus(local_nexus, below_nexus)
        self._track_nexus_announced(local_nexus)
        self.announce_nexus_above_cb(local_nexus)