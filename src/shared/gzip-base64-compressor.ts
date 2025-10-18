export class GzipBase64Compressor {

  static compressArray(decompressedData: Uint8Array<ArrayBuffer>) : Promise<string>
  {
    return new Promise<string>((resolve,reject) => {
      
      // Compress with gzip
      const compressor = new CompressionStream("gzip");
      let compressedData = new Uint8Array();
      let reader = compressor.readable.getReader();

      let compressedDataHandler = (result: ReadableStreamReadResult<Uint8Array<ArrayBuffer>>)=>{
        if (result.value)
        {
          var mergedArray = new Uint8Array(compressedData.length + result.value.length);
          mergedArray.set(compressedData);
          mergedArray.set(result.value, compressedData.length);
          compressedData = mergedArray;
        }

        if (result.done)
        {
          let base64String = compressedData.toBase64();

          console.log(`Compression: ${decompressedData.length} raw =>  ${compressedData.length} gzip => ${base64String.length} base64str`);
          resolve(base64String);
        }
        else
        {
          reader.read().then(compressedDataHandler);
        }
      };

      reader.read().then(compressedDataHandler);

      let writer = compressor.writable.getWriter();
      writer.write(decompressedData);
      writer.close();
    });
  }

  static compressString(str: string) : Promise<string>
  {
    // Convert to bytearray
    const encoder = new TextEncoder();
    const decompressedData = encoder.encode(str);
    return GzipBase64Compressor.compressArray(decompressedData);
  }

  static compressObject<T>(obj: T) : Promise<string>
  {
    // Write object to json
    const objJson = JSON.stringify(obj);
    return GzipBase64Compressor.compressString(objJson);
  }

  static decompressArray(base64String: string): Promise<Uint8Array<ArrayBuffer>>
  {
    return new Promise<Uint8Array<ArrayBuffer>>((resolve,reject) => {

      // Base64 to byte array
      let compressedData = new Uint8Array(Math.ceil(base64String.length * (3 / 4)));
      const result = compressedData.setFromBase64(base64String);
      compressedData = new Uint8Array(compressedData.buffer, 0, result.written)

      // decompress byte array
      const decompressor = new DecompressionStream("gzip");
      let decompressedData = new Uint8Array();
      let reader = decompressor.readable.getReader();

      let decompressedDataHandler = (result: ReadableStreamReadResult<Uint8Array<ArrayBuffer>>)=>{
        if (result.value)
        {
          var mergedArray = new Uint8Array(decompressedData.length + result.value.length);
          mergedArray.set(decompressedData);
          mergedArray.set(result.value, decompressedData.length);
          decompressedData = mergedArray;
        }

        if (result.done)
        {
          console.log(`Decompression: ${base64String.length} base64 str => ${compressedData.length} gzip => ${decompressedData.length} raw`);
          resolve( decompressedData );
        }
        else
        {
          reader.read().then(decompressedDataHandler);
        }
      };

      reader.read().then(decompressedDataHandler);

      let writer = decompressor.writable.getWriter();
      writer.write(compressedData);
      writer.close();
    });
  }

  static decompressString(base64String: string) : Promise<string>
  {
    return new Promise<string>((resolve,reject) => {
      GzipBase64Compressor.decompressArray(base64String).then((decompressedData)=>{
        const decoder = new TextDecoder();
        resolve(decoder.decode(decompressedData));
      });
    });
  }

  static decompressObject<T>(str: string) : Promise<T>
  {
    return new Promise<T>((resolve, reject)=>{
      GzipBase64Compressor.decompressString(str).then((jsonString)=>{
        resolve(JSON.parse(jsonString) as T);
      });
    });
  }
}
