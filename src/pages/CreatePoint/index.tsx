import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';

import { Link, useHistory } from 'react-router-dom';

import { Map, TileLayer, Marker} from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';

import axios from 'axios';
import api from '../../services/api';

import './styles.css';
import logo from '../../assets/logo.svg';
import { FiArrowDownLeft } from 'react-icons/fi'


interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IBGEUFResponse {
    sigla: string
}

interface IBGECityResponse {
    nome: string
}

const CreatePoint = () => {
    
    const [inputData, setInputData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [items, setItems] = useState <Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([])
    const [initialPosition, setInitialPosition] = useState<[number,number]>([0,0]);
    const [mapSelectedPosition, setMapSelectedPosition] = useState<[number,number]>([0,0]);

    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity,setSelectedCity] = useState('');
    const [selectedUf,setselectedUf] = useState('0');

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, [])

    useEffect(()=>{
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map( uf  => uf.sigla);

            setUfs(ufInitials);
        });
    }, []);

    useEffect(()=>{
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        if (selectedUf === '0') return;

        axios
        .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then( response => {
            const citiesNames = response.data.map( city  => city.nome);

            setCities(citiesNames);

        });
    }, [selectedUf]);

    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;
        setselectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;
        setSelectedCity(city);
    }

    function handleMapClick (event: LeafletMouseEvent) {
       // console.log(event.latlng);

        setMapSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ]);
        
        
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
       
        const { name ,value } = event.target;
        setInputData({
            ...inputData, [name]: value
        })
    }

    function handleClickItem(id: number) {
        let alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0) {
            let filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems([...filteredItems]);
        }else{
            setSelectedItems([...selectedItems, id]);
        }

        
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, phone} = inputData;
        const uf = selectedUf;
        const city = selectedCity;
        const items = selectedItems;
        const [ latitude, longitude] = mapSelectedPosition;
        const data = {
            name,
            email,
            phone,
            uf,
            city,
            latitude,
            longitude,
            items
        }
        await api.post('points', data);

        alert('success');
        
        history.push('/');
    }
    return (
        <div id="page-create-point">
            <header>
                    <img src={logo} alt="E-coleta"/>
                    
                    <Link to="/">
                    <FiArrowDownLeft/>
                    Voltar para home
                    </Link>
                </header>


                <form onSubmit={handleSubmit}>
                   <h1>Cadastro do <br/> ponto de coleta</h1>

                    <fieldset>
                        <legend>
                            <h2>Dados</h2>
                        </legend>

                        <div className="field">
                            <label htmlFor="name">Nome da entidade</label>
                            <input 
                                type="text" 
                                name="name" 
                                id="name"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="email">E-mail</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    id="email"
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="field">
                            <label htmlFor="phone">Telefone (Whatsapp)</label>
                            <input 
                                type="text" 
                                name="phone" 
                                id="phone"
                                onChange={handleInputChange}
                            />
                            </div>
                        </div>
                    </fieldset> 

                    <fieldset>
                        <legend>
                            <h2>Endereço</h2>
                            <span>Selecione o endereço no mapa</span>
                        </legend>
                        <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
                            <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker 
                            position={mapSelectedPosition}
                            />
                        </Map>
                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="uf">Estado (UF)</label>
                                <select 
                                  name="uf" 
                                  id="uf" 
                                  onChange={handleSelectUF}
                                >
                                <option value="0">Selecione uma UF</option>
                                    {ufs.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                    
                                </select>
                            </div>

                            <div className="field">
                                <label htmlFor="city">Cidade</label>
                                <select name="city" id="city" onChange={handleSelectCity}>
                                    <option value="0">Selecione uma Cidade</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </fieldset> 
                    <fieldset>
                        <legend>
                            <h2>Ítens de coleta</h2>
                            <span>Selecione um ou mais ítens abaixo</span>
                        </legend>
                        
                        <ul className="items-grid">
                            {items.map(item => (
                                <li 
                                key={item.id} 
                                onClick={() => handleClickItem(item.id)}
                                className={selectedItems.includes(item.id)? 'selected': ''}
                                >
                                    <img src={item.image_url} alt={item.title}/>
                                    <span>{item.title}</span>
                                </li>
                            ))}
                            
                        </ul>
                    </fieldset> 

                    <button type="submit"> Cadastrar ponto de coleta </button>
                </form>
               
        </div>
    );
}

export default CreatePoint;