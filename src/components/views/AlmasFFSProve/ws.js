import {observable, autorun} from 'mobx';
import React from 'react';
import autobind from 'autobind-decorator';

export default class almasFFSC extends React.Component {
    @observable isLoading = true;
    @observable status = 'not set';

    // stop it from re-sending same step
    @observable stepCheck = -1;


    constructor() {
        super();
    }

    mult = (strNum1,strNum2) => {
        var a1 = strNum1.split("").reverse();
        var a2 = strNum2.toString().split("").reverse();
        var aResult = new Array;
    
        for ( var iterNum1 = 0; iterNum1 < a1.length; iterNum1++ ) {
            for ( var iterNum2 = 0; iterNum2 < a2.length; iterNum2++ ) {
                var idxIter = iterNum1 + iterNum2;    // Get the current array position.
                aResult[idxIter] = a1[iterNum1] * a2[iterNum2] + ( idxIter >= aResult.length ? 0 : aResult[idxIter] );
    
                if ( aResult[idxIter] > 9 ) {    // Carrying
                    aResult[idxIter + 1] = Math.floor( aResult[idxIter] / 10 ) + ( idxIter + 1 >= aResult.length ? 0 : aResult[idxIter + 1] );
                    aResult[idxIter] %= 10;
                }
            }
        }
        return aResult.reverse().join("");
    }
    
    modulo = (aNumStr, aDiv) => {
        var tmp = "";
        var  i, r;
        for ( i=0; i<aNumStr.length ; i++)
        {
            tmp += aNumStr.charAt( i);
            r = tmp % aDiv;
            tmp = r.toString( 10);
        }
        return tmp / 1;
    }
    
    // Generate a unique r and calculate x from it
    @autobind
    genX(n, forID, rnd = 1) {
        var r = Math.floor(Math.random() * n),
            rs = r.toString(),
            r2 = this.mult(rs,rs),
            x = this.modulo(r2.toString(), n),
            xJSON = JSON.stringify({'type' : 'almasFFSMobile', 'forID': forID, 'round' : rnd, 'step' : 1, 'data' : x });
        return [r, x, xJSON];
    }

    // Check whether if we should be sending data
    sendCheck = (data, ws) => {
        ws.send(data);
    }
    
    /*
    FIAT-SHAMIR IDENTITY BASED CRYPTOSYSTEM
    */
    almasFFSSubmit = (data) => {
        data = JSON.parse(data);
        url = data['wsURL'];
        forID  = data['uID'];
        this.isLoading = true;
        this.status = 'not set';
        this.stepCheck = -1;
        var ws = new WebSocket(url);

        /*
        THIS MUST BE PULLED IN FROM THE LOCAL DEVICE RATHER THAN HARDCODED HERE
        CHANGE ASAP
        */
        var v = [2333866390, 91504984, 24182319, 2679948747, 2426252266, 1543844700, 2667701433, 437491298, 2039680765, 153121206],
            s = [1220448689, 386273255, 15269095, 79929288, 1066903174, 592861078, 278860438, 905288239, 536397697, 51542499],
            I = 'Sirvan Almasi || 26/01/1992 || Saqqez || Sirvan3tr@gmail.com',
            j = [879526612, 1864187998, 3119683462, 785478098, 1061096975, 2814024602, 972289411, 2683930126, 1899345369, 666184941],
            n = 3328912597,
            deeIDAdd = '';
        
        var rndStatus = {'round' : 1, 'status' : false, 'fails' : 0},
            e = [],
            rnds = 10;
            r = 0;
        
        ws.onopen = () => {
            console.log('Opened websocket');

            // Step 0: Initiate Proof with WebServer
            if(this.stepCheck < 0) {
                let inj = {'I': I, 'j' : j, 'n' : n},
                    innit = JSON.stringify({'type' : 'almasFFSMobile', 'forID': forID, 'round' : 1, 'step' : 0, 'data' : inj});
                this.stepCheck = 0
                this.sendCheck(innit, ws);
            }
        };
        
        ws.onmessage = (event) => {
            let dataJSON = JSON.parse(event.data);
            this.shouldSend = true;

            if (dataJSON['round'] != rndStatus['round'] && rndStatus['status'] == true) {
                // We have a new round
                newRound = true;
                rndStatus['round'] += 1;
                rndStatus['status'] = false;
            } else {
                newRound = false;
            }
            /* ===================================
            Step 1: random r
            =================================== */
            if (dataJSON['step'] == 1 && ( this.stepCheck < 1 || this.stepCheck > 4)) {
                // Get num of rounds
                rnds = dataJSON['rnds'];
                // Begin
                console.log('Round: ' + rndStatus['round']);
                [r, x, xJSON] = this.genX(n, forID, rndStatus['round']);
                console.log('x: ' + x);
                this.stepCheck = 1;
                this.sendCheck(xJSON, ws);

            /* ===================================
            Step 2: Server sends random bit vector
            =================================== */
            } else if (dataJSON['step'] == 2 && this.stepCheck < 2) {
                e = dataJSON['data'];
                console.log('e: ' + e)
            /* ===================================
            Step 3: Send y
            =================================== */
                let y = r;
                for(let i=0; i < s.length; i++) {
                    if (e[i]==1) {
                        let ys = y.toString();
                        let ss = s[i].toString();
                        y = this.mult(ys, ss);
                    }
                }
                y = this.modulo(y.toString(),n);
                console.log('y: ' + y)            
                let yJSON = JSON.stringify({'type' : 'almasFFSMobile', 'forID': forID, 'round' : data['round'], 'step' : 3, 'data' : y});
                this.stepCheck = 2; // Skipping step 3 implementation
                this.sendCheck(yJSON, ws);
            /* ===================================
            Step 4: Get confirmation
            =================================== */
            } else if(dataJSON['step'] == 4 && this.stepCheck < 4) {
                if (dataJSON['data']=='Fail') rndStatus['fails'] += 1;
                console.log('Result: ' + dataJSON['data']);
                // Begin again
                if (rndStatus['round'] < rnds) {
                    let innit = JSON.stringify({'type' : 'almasFFSMobile', 'forID': forID, 
                        'round' : rndStatus['round']+1, 'step' : 0, 'data' : ''});
                    this.sendCheck(innit, ws);
                    rndStatus['round'] +=1;
                } else {
                    console.log('The End');
                    console.log('Fails: ' + rndStatus['fails'] + '/' + rndStatus['round']);

                    ws.close();
                    if (rndStatus['fails'] > 0) {
                        this.status = "Fail";
                    } else {
                        this.status = "Pass";
                    }
                }
                this.stepCheck = 5;
            } else {
                console.log('Error');
            }
        }; // on msg
    }// submitFunction
}