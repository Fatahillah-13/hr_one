import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import React from "react";
import "./index.css";

export default function Main() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="main-container">
            <div className="login-card">
                <div className="section">
                    <form onSubmit={submit}>
                        <div className="form-section">
                            <div className="group">
                                <div className="head-form">
                                    <span className="form-title">Halo 👋</span>
                                    <span className="form-subtitle">
                                        Login sekali untuk mengakses seluruh
                                        sistem
                                    </span>
                                </div>
                                <div className="form-wrapper">
                                    <div className="box">
                                        <div className="section-4">
                                            <span className="text-3">
                                                username
                                            </span>
                                            <span className="text-4">
                                                Isikan username anda
                                            </span>
                                        </div>
                                    </div>
                                    <div className="box-2">
                                        <div className="box-3">
                                            <div className="wrapper-3">
                                                <div className="img" />
                                                <div className="wrapper-4">
                                                    <span className="text-5">
                                                        Password
                                                    </span>
                                                    <span className="text-6">
                                                        Isikan password anda
                                                    </span>
                                                </div>
                                                <div className="pic-2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="section-5">
                                    <span className="text-7">Login</span>
                                </div>
                            </div>
                        </div>
                    </form>
                    <div className="image-section">
                        <div className="img-2" />
                        <span className="text-8">HRIS System V.2.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
