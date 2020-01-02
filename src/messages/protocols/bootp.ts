import { fixBuff, stringToAscii } from './util'
const bp = require('binary-parser-encoder'); // Binary parser module
const Parser = bp.Parser;
const sp = require('schemapack');
// BOOTP packet 
const bootp1 = sp.build([
    { opcode: 'uint8' },             // Operation code, 1: BOOTREQUEST, 2: BOOTREPLY
    { hw: 'uint8' },                 // Hardware Type, 1: Ethernet
    { hw_length: 'uint8' },          // Hardware Address length
    { hopcount: 'uint8' },           // Set to 0 by client before transmitting
    { xid: 'uint32' },               // Transaction ID
    { secs: 'uint16' },              // Seconds since client started trying to boot
    { flags: 'uint16' },             // Optional flag, not used 
    { ciaddr: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8' } },    // Client IP Address
    { pad: 'string' }
]);
const bootp2 = sp.build([
    { yiaddr: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8' } },        // Your IP Address ( Server assigns to client )
    { server_ip: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8' } },     // Server IP Address
    { bootp_gw_ip: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8' } },   // Gateway IP Address
    { hwaddr: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8' } },  // MAC Address of client (BB)
    { pad: 'string' }
]);
const bootp_servername = sp.build([
    {
        servername: {
            0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8',
            8: 'uint8', 9: 'uint8',
        }
    },                                    // Server Name
    { pad: 'string' }
]);
const bootp_bootfile = sp.build([ // Name of File (max 72 char here) to boot, splitted in 8 parts as max object size supported is 9
    { bootfile1: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile2: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile3: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile4: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile5: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile6: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile7: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { bootfile8: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { pad: 'string' }
]);
// Max array size supported is 9, splitting vendor field in two parts
const bootp_vendor1 = sp.build([       // Vendor extensions (4 Byte MAGIC COOKIE and DHCP OPTIONS)
    { vendor1: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { pad: 'string' }
]);
const bootp_vendor2 = sp.build([
    { vendor2: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { pad: 'string' }
]);
const bootp_vendor3 = sp.build([
    { vendor3: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8', 5: 'uint8', 6: 'uint8', 7: 'uint8', 8: 'uint8' } },
    { pad: 'string' }
]);
const bootp_vendor4 = sp.build([
    { vendor4: { 0: 'uint8', 1: 'uint8', 2: 'uint8', 3: 'uint8', 4: 'uint8' } },
    { pad: 'string' }
]);

export class BOOTP {
    parseBOOTP(buff: any) {
        // BOOTP packet
        const bootp = new Parser()
            .uint8('opcode')
            .uint8('hw')
            .uint8('hwlength')
            .uint8('hopcount')
            .uint32be('xid')
            .uint16be('secs')
            .uint16be('flags')
            .array('ciaddr', {
                type: 'uint8',
                length: 4
            })
            .array('yiaddr', {
                type: 'uint8',
                length: 4
            })
            .array('server_ip', {
                type: 'uint8',
                length: 4
            })
            .array('bootp_gw_ip', {
                type: 'uint8',
                length: 4
            })
            .array('hwaddr', {
                type: 'uint8',
                length: 16
            })
            .array('servername', {
                type: 'uint8',
                length: 64
            })
            .array('bootfile', {
                type: 'uint8',
                length: 128
            })
            .array('vendor', {
                type: 'uint8',
                length: 64
            });

        return bootp.parse(buff);

    }

    // Function for BOOTP packet
    makeBOOTP(server_name: any, file_name: any, xid_: any, hw_dest: any, BB_ip: any, serverIP: any) {
        const bootp_1 = [
            { opcode: 2 },
            { hw: 1 },
            { hw_length: 6 },
            { hopcount: 0 },
            { xid: xid_ },
            { secs: 0 },
            { flags: 0 },
            { ciaddr: [0, 0, 0, 0] }
        ];
        const bootp_2 = [
            { yiaddr: BB_ip },
            { server_ip: serverIP },
            { bootp_gw_ip: serverIP },
            { hwaddr: hw_dest }
        ];
        const servername = [{ servername: server_name }];
        const filename = stringToAscii(file_name);
        const bootfile = [
            { bootfile1: filename.slice(0, 9) },
            { bootfile2: filename.slice(9, 18) },
            { bootfile3: filename.slice(18, 27) },
            { bootfile4: filename.slice(27, 36) },
            { bootfile5: filename.slice(36, 45) },
            { bootfile6: filename.slice(45, 54) },
            { bootfile7: filename.slice(54, 63) },
            { bootfile8: filename.slice(63, 72) },
        ];
        const vendor1 = [{ vendor1: [99, 130, 83, 99, 53, 1, 5, 1, 4] }];  // 4 Byte MAGIC COOKIE and DHCP OPTIONS
        const vendor2 = [{ vendor2: [225, 255, 255, 0, 3, 4, 192, 168, 1] }];
        const vendor3 = [{ vendor3: [9, 51, 4, 255, 255, 255, 255, 54, 4] }];
        const vendor4 = [{ vendor4: [192, 168, 1, 9, 0xFF] }];
        const buf1 = fixBuff(bootp1.encode(bootp_1));
        const buf2 = fixBuff(bootp2.encode(bootp_2));
        const buf2_ = Buffer.alloc(10);           // Remaining 10 bytes out of 16 of hwaddr
        const buf3 = fixBuff(bootp_servername.encode(servername));
        const buf3_ = Buffer.alloc(54);           // Remaining 54 bytes out of 64 of servername
        const buf4 = fixBuff(bootp_bootfile.encode(bootfile));
        const buf4_ = Buffer.alloc(56);          // Remaining 56 bytes out of 128 of bootfile
        const buf5 = fixBuff(bootp_vendor1.encode(vendor1));
        const buf5a = fixBuff(bootp_vendor2.encode(vendor2));
        const buf5b = fixBuff(bootp_vendor3.encode(vendor3));
        const buf5c = fixBuff(bootp_vendor4.encode(vendor4));
        const buf5d = Buffer.alloc(32);           // Remaining 32 bytes out of 64 of vendor
        return Buffer.concat([buf1, buf2, buf2_, buf3, buf3_, buf4, buf4_, buf5, buf5a, buf5b, buf5c, buf5d], 300);

    }
}