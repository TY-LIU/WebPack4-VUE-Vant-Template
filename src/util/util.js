/**
 * Author: LTY
 * Create Time: 2018-12-24 18:11
 * Description: 公共方法 axios请求,等待框,加解密,批量上传图片，生成唯一键
 */
import auth from './auth'
import store from '../store'
import router from '../router'
import axios from './axios'
import {Toast} from 'vant'

/**
 * @author LTY 7/31
 * @class axios接口请求二次封装的工具类
 * */
export class AxiosRequest {
    /**
     * @description axios接口请求二次封装
     * @param url           接口地址
     * @param param         参数
     * @param method        请求方式，默认post
     * @param responseType  接口返回数据格式，默认text
     * @param contentType   请求头传递格式，默认json
     * @param typeChange    是否需要转格式，默认false，选择true，则以Form Data 格式传值，否则JSON
     * @param errTitle      错误提示，默认浏览器返回的错误信息
     * @param timeout       请求超时时间，默认25000ms
     * */
    static async current(url, param = {}, {method = 'post', responseType = 'text', contentType = '', typeChange = false, errTitle = '', timeout = 25000} = {}) {
        console.log(param);
        let params = {};
        if (method === 'get') params = param;
        try {
            return await axios({
                url: url,
                data: typeChange ? param : JSON.stringify(param),
                params: params,
                method: method,
                baseURL: `${process.env.API_HOST}`,
                timeout: timeout,
                responseType: responseType,
                headers: {
                    'Content-Type': contentType || typeChange ? 'application/x-www-form-urlencoded; charset=UTF-8' : 'application/json;charset=UTF-8'
                }
            }).then((res) => {
                console.log(res);
                if (res.code === '10001') {
                    auth.logout();
                    router.push('/login');
                    store.commit('SET_USER', '');
                }
                return res
            })
        } catch (error) {
            if (error.message) {
                // 一些错误是在设置请求的时候触发
                if (error.message.includes('timeout')) {
                    Toast.fail.error('数据请求超时,请检查网络');
                } else if (error.message.includes('cookie')) {
                    Toast.fail.error('浏览器阻止了cookie,请求被中断,网页无法正常使用');
                } else Toast.fail.error(errTitle || error.message);
            }
            throw new Error(error)
        }
    }

    static async post(url, param = {}, {typeChange = false} = {}) {
        return this.current(url, param, {method: 'post', typeChange: typeChange})
    }

    static async get(url, param = {}, {typeChange = false} = {}) {
        return this.current(url, param, {method: 'get', typeChange: typeChange})
    }
}

export default {
    /**
     * @author LTY
     * @description PX转VW
     * @param size            px大小
     * @return number         返回适应当前窗口的字体大小，单位VW
     * */
    getVwUnit(size) {
        return size / window.screen.width * 100
    },

    /**
     *  @author LTY 8/22
     *  @description 判断返回参数是否正确（用于请求队列）
     *  @param res 返回参数
     * */
    judge(res) {
        if (res.code === '200') return res.data;
        else {
            Toast.fail.error(res.message);
            throw new Error(res.message)
        }
    },

    /**
     * @author LTY
     * @description 判断两个对象是否相等，包括递归
     * @param x 对比对象x
     * @param y 对比对象y
     * */
    equals(x, y) {
        const f1 = x instanceof Object;
        const f2 = y instanceof Object;
        if (!f1 || !f2) return x === y;
        if (Object.keys(x).length !== Object.keys(y).length) return false;
        const newX = Object.keys(x);
        for (let p in newX) {
            p = newX[p];
            const a = x[p] instanceof Object;
            const b = y[p] instanceof Object;
            if (a && b) {
                const equal = this.equals(x[p], y[p]);
                if (!equal) return equal
            } else if (x[p] !== y[p]) return false
        }
        return true
    },

    // 字符串转16进制
    strToHexCharCode(str) {
        if (str === '') return '';
        const hexCharCode = [];
        hexCharCode.push('0x');
        for (let i = 0; i < str.length; i++) {
            hexCharCode.push((str.charCodeAt(i)).toString(16));
        }
        return hexCharCode.join('')
    },

    // 16进制转字符串
    hexCharCodeToStr(hexCharCodeStr) {
        const trimedStr = hexCharCodeStr.trim();
        const rawStr = trimedStr.substr(0, 2).toLowerCase() === '0x' ? trimedStr.substr(2) : trimedStr;
        const len = rawStr.length;
        if (len % 2 !== 0) {
            alert('Illegal Format ASCII Code!');
            return '';
        }
        let curCharCode;
        const resultStr = [];
        for (let i = 0; i < len; i = i + 2) {
            curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
            resultStr.push(String.fromCharCode(curCharCode));
        }
        return resultStr.join('')
    },

    /**
     * @author LTY
     * @description 生成唯一键
     * */
    guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
    },

    /**
     * @author LTY
     * @description 只能输入数字,最多输入len位,且保留N位小数
     * @param val 传递的字符
     * @param len 最多能能输入的位数
     * @param n 保留的小数位数
     * */
    numPoint({val, len = 8, n = 2} = {}) {
        const reg = new RegExp('^(\\-)*(\\d+)\\.(\\d{0,' + n + '}).*$');
        let str = val.toString();
        str = str.replace(/[^\d.]/g, ''); // 先去除非数字字符
        str = str.replace(/^\./g, ''); // 验证第一个字符是数字而不是
        str = str.replace(/\.{2,}/g, '.'); // 只保留第一个. 清除多余的
        str = str.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
        n === 0 ? str = str.replace(reg, '$1$2') : str = str.replace(reg, '$1$2.$3'); // 只能输入数字不包括小数 | 包括后N位
        if (str.indexOf('.') > 0) str = str.split('.')[0].substr(0, len) + '.' + str.split('.')[1]; // 最多只能输入len位
        else str = str.substr(0, len);
        return str
    },

    /**
     * @method formatMoney
     * @description 金额按千位逗号分隔
     * @param s 需要格式化的金额数值.
     * @param type 判断格式化后的金额是否需要小数位.
     * @return 返回格式化后的数值字符串.
     * */
    formatMoney(s, type) {
        if (!s) return '0.00';
        if (/[^0-9.]/.test(s)) return '0.00';
        s = s.toString().replace(/^(\d*)$/, '$1.');
        s = (s + '00').replace(/(\d*\.\d\d)\d*/, '$1');
        s = s.replace('.', ',');
        const re = /(\d)(\d{3},)/;
        while (re.test(s)) {
            s = s.replace(re, '$1,$2');
        }
        s = s.replace(/,(\d\d)$/, '.$1');
        if (type === 0) {
            const a = s.split('.');
            if (a[1] === '00') s = a[0]
        }
        return s
    },

    /**
     *  @author LTY
     *  @description 集合根据字段分组方法
     *  @param array 集合 格式必须是[{},{},...]
     *  @param f 匿名函数 根据函数中的字段进行分组 (item)=>{ return [item[字段],...]; }
     * */
    groupBy(array, f) {
        const groups = {};
        array.forEach((o) => {
            const group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map((group) => {
            return groups[group];
        })
    }
}
