<?php
/**
 * Mavenbird Technologies Private Limited
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://mavenbird.com/Mavenbird-Module-License.txt
 *
 * =================================================================
 *
 * @category   Mavenbird
 * @package    Mavenbird_OneStepCheckout
 * @author     Mavenbird Team
 * @copyright  Copyright (c) 2018-2024 Mavenbird Technologies Private Limited ( http://mavenbird.com )
 * @license    http://mavenbird.com/Mavenbird-Module-License.txt
 */

namespace Mavenbird\OneStepCheckout\Model\Config\Backend;

use Magento\Framework\App\Config\Value;
use Magento\Framework\App\Cache\TypeListInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Data\Collection\AbstractDb;
use Magento\Framework\Model\Context;
use Magento\Framework\Model\ResourceModel\AbstractResource;
use Magento\Framework\Registry;
use Magento\Framework\Serialize\SerializerInterface;

class Address extends Value
{
    /**
     * Unserializes
     *
     * @var [type]
     */
    private $unserialize;

    /**
     * Construct
     *
     * @param SerializerInterface $unserialize
     * @param Context $context
     * @param Registry $registry
     * @param ScopeConfigInterface $config
     * @param TypeListInterface $cacheTypeList
     * @param AbstractResource|null $resource
     * @param AbstractDb|null $resourceCollection
     * @param array $data
     */
    public function __construct(
        SerializerInterface $unserialize,
        Context $context,
        Registry $registry,
        ScopeConfigInterface $config,
        TypeListInterface $cacheTypeList,
        AbstractResource $resource = null,
        AbstractDb $resourceCollection = null,
        array $data = []
    ) {
        $this->unserialize = $unserialize;
        parent::__construct(
            $context,
            $registry,
            $config,
            $cacheTypeList,
            $resource,
            $resourceCollection,
            $data
        );
    }

    /**
     * BeforeSave
     *
     * @return void
     */
    public function beforeSave()
    {
        $value = $this->getValue();
        if (isset($value['rows']['street'])) {
            if ($value['rows']['street']) {
                $value['rows']['street']['visible'] = 'on';
                $value['rows']['street']['required'] = 'on';
                $value['rows']['street']['width'] = 100;
            }
        }
        if (isset($value['rows']['region_id'])) {
            if ($value['rows']['region_id']) {
                $region = $value['rows']['region_id'];
                $value['rows']['region'] = $region;
            }
        }
        if ($value) {
            $this->setValue($this->unserialize->serialize($value));
        }
        return $this;
    }

    /**
     * AfterLoad
     *
     * @return void
     */
    public function afterLoad()
    {
        if ($currentVal = $this->getValue()) {
            if ($this->is_serialized($currentVal)) {
                $currentVal = $this->unserialize->serialize($currentVal);
            } else {
                $currentVal = json_decode($this->getValue(), true);
            }
            if (is_array($currentVal)) {
                $this->setValue($currentVal);
            }
        }


        return $this;
    }

    /**
     * Isserialized
     *
     * @param [type] $value
     * @param [type] $result
     * @return boolean
     */
    public function is_serialized($value, &$result = null)
    {
        if (!is_string($value)) {
            return false;
        }
        if ($value === 'b:0;') {
            $result = false;
            return true;
        }
        $length = strlen($value);
        $end    = '';
        switch ($value[0]) {
            case 's':
                if ($value[$length - 2] !== '"') {
                    return false;
                }
            case 'b':
            case 'i':
            case 'd':
                $end .= ';';
            case 'a':
            case 'O':
                $end .= '}';
                if ($value[1] !== ':') {
                    return false;
                }
                switch ($value[2]) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                    case 9:
                        break;
                    default:
                        return false;
                }
            case 'N':
                $end .= ';';
                if ($value[$length - 1] !== $end[0]) {
                    return false;
                }
                break;
            default:
                return false;
        }
        if (($result = @unserialize($value)) === false) {
            $result = null;
            return false;
        }
        return true;
    }
}
