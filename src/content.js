var debug = false
var log = debug ? console.log.bind(console) : function() {}
var prefix = 'atz_'
var siteinfo = [
    {
        host: 'my.jcb.co.jp',
        url_regex : '^https://my.jcb.co.jp/iss-pc/member/details_inquiry/detail.html.*',
        list_xpath : '//td[@class="useDay"]/..',
        list_date_xpath: './td[@class="useDay"]/p',
        list_amount_xpath : './td[@class="amountPayable"]/p',
        list_place_xpath : './td[@class="useAhead"]/p',
        list_comment_xpath : './td[@class="useAhead"]/p',
        example_urls: 'https://my.jcb.co.jp/iss-pc/member/details_inquiry/detail.html?detailMonth=1&output=web'
    },
    {
        host: 'www.amazon.co.jp',
        url_regex : '^https://www.amazon.co.jp/gp/css/summary/edit.html.*',
        list_xpath : '//a[starts-with(@href, "http://www.amazon.co.jp/gp/product/")]/../../..',
        list_comment_xpath: './/a',
        list_amount_xpath : './td[last()]',
        date_xpath: '(//b[contains(., "注文日")])/..',
        amount_xpath: '(//a[@href="#payment-info"])/..',
        comment_xpath: '//b[contains(., "注文商品")]/../../..//a',
        place_default: 'Amazon.co.jp',
        exmaple_urls: 'https://www.amazon.co.jp/gp/css/summary/edit.html?ie=UTF8&orderID=XXX-XXXXXXXX-XXXXXXXX'
    },
    {
        host: 'www.amazon.co.jp',
        url_regex : '^https://www.amazon.co.jp/gp/css/order-history.*',
        list_xpath: '(//div[@class="order-level"])/..',
        list_date_xpath : './/h2',
        list_comment_xpath: './/span[@class="item-title"]',
        list_amount_xpath : './/span[@class="price"]',
        place_default: 'Amazon.co.jp',
        exmaple_urls: 'https://www.amazon.co.jp/gp/css/order-history'
    },
    {
        host: 'order.my.rakuten.co.jp',
        url_regex : '^https://order.my.rakuten.co.jp/.+detail_view',
        amount_xpath: '(//table[@class="packageTable"]//td)[last()]',
        date_xpath: 'id("detailContents")/h2',
        place_xpath : '(id("detailShopInfo")/dl[1]//a)[last()]',
        comment_xpath: '//table[@class="packageTable"]/tbody/tr[count(./td)>=7]//a[@class="itemLink" and not(./img)]',
        list_xpath: '//table[@class="packageTable"]/tbody/tr[count(./td)>=7]',
        list_amount_xpath: '(td[contains(., "円")])[last()]',
        list_comment_xpath: '(.//a[@class="itemLink"])[last()]',
        exmaple_urls: 'https://order.my.rakuten.co.jp/?page=myorder&act=detail_view&shop_id=XXXXXX&order_number=XXXXXX-XXXXXX-XXXXXXXXXX'
    },
    {
        host: 'direct11.bk.mufg.jp',
        url_regex : '^https://direct11.bk.mufg.jp/.+banking',
        amount_xpath: '',
        date_xpath: '',
        place_xpath: '',
        comment_xpath: '',
        list_xpath: '//table[contains(@class, "data memo")]/tbody/tr',
        list_amount_xpath: './td[2]',
        list_date_xpath : './td[contains(@class, "date")]',
        list_place_xpath : './td[@class="transaction"]',
        list_comment_xpath: './td[@class="transaction"]',
        exmaple_urls: 'https://direct11.bk.mufg.jp/ib/dfw/APL/bnkib/banking'
    },
    {
        host: 'direct11.bk.mufg.jp',
        url_regex : '^https://direct11.bk.mufg.jp/.+frm_super.cgi',
        amount_xpath: '',
        date_xpath: '',
        place_xpath: '',
        comment_xpath: '',
        list_xpath: '//table[@class="table"]/tbody/tr[@class="center" or @class="gray2"]',
        list_amount_xpath: './td[2]',
        list_date_xpath : './td[1]',
        list_place_xpath : './td[5]',
        list_comment_xpath: './td[4]',
        exmaple_urls: 'https://direct11.bk.mufg.jp/ib/dfw/MAIN/CGI/plus/frm/frm_super.cgi'
    }/*,
    {
        host: '',
        url_regex : '',
        amount_xpath: '',
        date_xpath: '',
        place_xpath: '',
        place_default: '',
        comment_xpath: '',
        comment_default: '',
        list_xpath: '',
        list_amount_xpath: '',
        list_date_xpath : '',
        list_place_xpath : '',
        list_comment_xpath: ''
    }*/
]
init()

function init() {
    if (location.href.indexOf('https://zaim.net/money/new') === 0 &&
        location.hash.indexOf(prefix) === 1) {
        input()
        return
    }
    var l = siteinfo.filter(function(i) {
        return !i.host || (i.host && location.host === i.host)
    })
    for (var i = 0; i < l.length; i++) {
        if (new RegExp(i.url_regex).test(location.href)) {
            if (setup(l[i])) {
                return
            }
        }
    }
}

function input() {
    var setval = function(s, v) {
        var node = document.querySelector(s)
        if (node && v) {
            node.value = v
        }
    }
    if (location.hash.indexOf(prefix) === 1) {
        var d = JSON.parse(decodeURIComponent(location.hash.substring(prefix.length + 1)))
        setval('#payment_amount', d.amount)
        setval('#payment_place', d.place)
        setval('#payment_comment', d.comment)
        var pd = document.querySelector('#payment_date')
        if (d.date && pd) {
            var pdd = pd.value.split(/[\d\(\)]+/)
            var dd = d.date.split('/')
            d.date = dd[0] + pdd[1] + dd[1] + pdd[2] + dd[2] + pdd[3]
            setval('#payment_date', d.date)
        }
    }
}

function setup(si) {
    var ok = false
    var getprop = function(k, n) {
        return find({at_css: si[k + '_css']}, n) || find({at_xpath: si[k + '_xpath']}, n)
    }
    var getprops = function(k, n) {
        return [].concat(find({css: si[k + '_css']}, n)).concat(
            find({xpath: si[k + '_xpath']}, n))
    }
    var nodes = {}
    nodes.list = getprops('list')
    nodes.date = getprop('date')
    nodes.amount = getprop('amount')
    nodes.place = getprop('place')
    nodes.comment = getprops('comment')
    var comment_t = nodes.comment.map(function(i) {
        return i.textContent.trim()
    }).join(' ')
    var sum = {
        date: exdate(nodes.date),
        amount: exnum(nodes.amount),
        place: extext(nodes.place) || si.place_default,
        comment: (nodes.comment.length > 0) ? comment_t : si.comment_default
    }
    log('si', si, 'sum', sum, 'nodes', nodes)
    if (nodes.amount) {
        addLink(sum, nodes.amount)
        ok = true
    }
    nodes.list.forEach(function(i) {
        var d = {}
        var amount = getprop('list_amount', i)
        d.amount = exnum(amount)
        if (amount && (/\d/).test(d.amount)) {
            d.date = exdate(getprop('list_date', i)) || sum.date
            d.place = extext(getprop('list_place', i)) || sum.place
            var cs = getprops('list_comment', i)
            d.comment = cs.length > 0 ? cs.map(function(i) {
                return i.textContent.trim()
            }).join(' ') : sum.comment
            addLink(d, amount)
            ok = true
        }
        log('list item', d)
    })
    return ok
}

function find(opt, node) {
    node = node || document
    if ('at_css' in opt || 'at_xpath' in opt) {
        if (opt.at_css) {
            return node.querySelector(opt.at_css)
        }
        else if (opt.at_xpath) {
            return x(opt.at_xpath, node)[0] // FIXME
        }
        return null
    } else {
        if (opt.css) {
            return Array.prototype.slice.call(node.querySelectorAll(opt.css))
        }
        else if (opt.xpath) {
            return x(opt.xpath, node)
        }
        return []
    }
}

function x(xpath, node) {
    node = node || document
    var result = []
    try {
        var r = document.evaluate(xpath, node, null, 7, null)
        for (var i = 0; i < r.snapshotLength; i++) {
            result.push(r.snapshotItem(i))
        }
    }
    catch(e) {
        log('xpath error', e)
        return result
    }
    return result
}

function extext(node) {
    return node && node.textContent && node.textContent.trim()
}

function exnum(node) {
    return node && node.textContent && node.textContent.replace(/[^\d]/g, '')
}

function exdate(s) {
    var re = (/(\d{4})[^\d]+(\d{1,2})[^\d+]+(\d{1,2})/)
    if (s) {
        var m = s.textContent.match(re)
        if (m) {
            return m.slice(1).join('/')
        }
    }
}

function addLink(d, n) {
    var de = prefix + encodeURIComponent(JSON.stringify(d))
    var link = document.createElement('a')
    link.className = 'add_to_zaim'
    link.href = "https://zaim.net/money/new#" + de
    // var t = JSON.stringify(d)
    var t = '\namount: ' + (d.amount || '') +
        '\ndate: ' + (d.date || '') +
        '\nplace:' + (d.place || '' ) +
        '\ncomment:' + (d.comment || '')
    link.appendChild(icon(t))
    n.appendChild(link)
}

function icon(t) {
    var img = document.createElement('img')
    img.src = chrome.extension.getURL('zaim_icon.png')
    img.title = 'Add to Zaim ' + (t || '')
    img.style.height = '1.2em'
    img.style.verticalAlign = 'top'
    img.style.padding = '0 0.5em'
    return img
}

function reset() {
    x('//a[@class="add_to_zaim"]').forEach(function(i) {
        i.parentNode.removeChild(i)
    })
}
