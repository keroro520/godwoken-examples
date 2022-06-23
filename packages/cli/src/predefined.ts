import * as lumosConfigManager from "@ckb-lumos/config-manager";

export const BETANET: lumosConfigManager.Config = lumosConfigManager.createConfig(
  {
    PREFIX: lumosConfigManager.predefined.AGGRON4.PREFIX,
    SCRIPTS: {
      ...lumosConfigManager.predefined.AGGRON4.SCRIPTS,

      rollup_type_script: {
        CODE_HASH:
          "0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854",
        // HASH_TYPE: "type",
        HASH_TYPE: "type",
        TX_HASH:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      eth_account_lock: {
        CODE_HASH:
          "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0",
        HASH_TYPE: "type",
        TX_HASH:
          "0x21da20f275af89ca7172cb1cd7fcb8676056e4212ba3782e8c77afebae57c6ed",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      deposit_lock: {
        CODE_HASH:
          "0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18",
        HASH_TYPE: "type",
        TX_HASH:
          "0x9caeec735f3cd2a60b9d12be59bb161f7c61ddab1ac22c4383a94c33ba6404a2",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      withdrawal_lock: {
        CODE_HASH:
          "0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6",
        HASH_TYPE: "type",
        TX_HASH:
          "0x9c607a9a75ea4699dd01b1c2a478002343998cac8346d2aa582f35b532bd2b93",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },
    },
  }
);

export const ALPHANET_V1_1: lumosConfigManager.Config = lumosConfigManager.createConfig(
  {
    PREFIX: lumosConfigManager.predefined.AGGRON4.PREFIX,
    SCRIPTS: {
      ...lumosConfigManager.predefined.AGGRON4.SCRIPTS,

      rollup_type_script: {
        CODE_HASH:
          "0x56abab7961e8348aed629a0e59c05d0f6b555314f8f95606eae4bcb2adafdce3",
        // HASH_TYPE: "type",
        HASH_TYPE: "type",
        TX_HASH:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      eth_account_lock: {
        CODE_HASH:
          "0x8d6af470fd57d1afe543751eed58afef310ec659d565319f448bcc765176dcdc",
        HASH_TYPE: "type",
        TX_HASH:
          "0x3943cd4d8de3176f8b69e0e5b8c1fa69bbbfbeef693d5b56e2facf2bc1dcb3cf",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      deposit_lock: {
        CODE_HASH:
          "0x9aa15280cf2123755516ff93180ab14b66a043562ffd70a0947afe7a12d573e5",
        HASH_TYPE: "type",
        TX_HASH:
          "0x84c66a1b9ba28d3add646e2aa8415925bc765c888e08edd26e42a27bba421dbc",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      withdrawal_lock: {
        CODE_HASH:
          "0xb580c581b8789dbd3add6c8d2efc63af3590b1a272d950e7dd1c2f64f5b425b5",
        HASH_TYPE: "type",
        TX_HASH:
          "0x1943b90cef80f8b132a13a3fa57814f76584aadec3d5bab5b08c79a9896e7945",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },
    },
  }
);
