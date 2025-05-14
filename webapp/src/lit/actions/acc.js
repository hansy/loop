const go = async () => {
  try {
    const str = await Lit.Actions.decryptAndCombine({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      authSig: null,
      chain,
    });

    const { videoTokenId, videoId, privateKey } = JSON.parse(str);
    const message = JSON.stringify({
      videoTokenId,
      videoId,
      nonce,
      exp,
      userAddress: Lit.Auth.authSigAddress,
    });

    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(message);

    Lit.Actions.setResponse({
      response: JSON.stringify({
        derivedVia: "lit.action",
        sig: signature,
        address: wallet.address,
        signedMessage: message,
      }),
    });
  } catch (e) {
    console.log(e);
    return;
  }
};

go();
